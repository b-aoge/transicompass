import crypto from 'node:crypto';
import { HAS_LLM, LLM_BASE_URL, LLM_API_KEY, MODEL_NAME } from './env';
import { DiagnosisPayloadSchema } from './validation/schemas';
import { buildHeuristic, emptyReport } from './heuristic';
import { TRACK_KB } from './knowledge';
import type { TrackCode } from './types/domain';
import type { DiagnosisPayload, DiagnosisRequest } from './types/api';

/**
 * 诊断引擎（Spec §9 / openapi /diagnosis）。
 * 真实链路：配置 DASHSCOPE_API_KEY → 调大模型。
 * 本地演示：无 key → 启发式降级（src/lib/heuristic.ts，结果由输入推导，证明非写死）。
 */

export type DiagnosisEvent =
  | { event: 'accepted'; data: { result_id: string; session_id: string } }
  | { event: 'progress'; data: { stage: string; percent: number } }
  | { event: 'skills'; data: { transferable_skills: DiagnosisPayload['transferable_skills'] } }
  | { event: 'matches'; data: { track_matches: DiagnosisPayload['track_matches']; top_gaps: DiagnosisPayload['top_gaps'] } }
  | { event: 'path'; data: { learning_path: DiagnosisPayload['learning_path']; rewrite_samples: DiagnosisPayload['rewrite_samples'] } }
  | { event: 'done'; data: { result_id: string; status: string; out_of_scope: boolean } }
  | { event: 'failed'; data: { code: number; message: string } };

/** resultId → 完整 payload（route 在 done 后读取并 saveResult） */
export const pendingResults = new Map<string, DiagnosisPayload>();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 岗位推荐兜底：保证每个赛道 typical_roles ≥ 3（用户要求「每个岗位至少推荐 3 个」）。
 * 大模型偶尔只回 2 个，这里用赛道知识库 typical_roles 补齐（去重、上限 6），
 * 同时兼容 LLM 原始 JSON（parse 前的 loose 结构）与已校验的 payload。
 */
const MIN_ROLES = 3;
const MAX_ROLES = 6;
function padTypicalRoles(input: unknown): DiagnosisPayload {
  if (!input || typeof input !== 'object') return input as DiagnosisPayload;
  const obj = input as { track_matches?: Array<{ track_code?: string; typical_roles?: unknown }> };
  if (!Array.isArray(obj.track_matches)) return input as DiagnosisPayload;
  obj.track_matches = obj.track_matches.map((m) => {
    const code = (m.track_code ?? '') as TrackCode;
    const kb = (TRACK_KB as Record<string, { typical_roles: string[] }>)[code]?.typical_roles ?? [];
    const roles = Array.isArray(m.typical_roles)
      ? m.typical_roles.filter((r): r is string => typeof r === 'string')
      : [];
    for (const r of kb) {
      if (roles.length >= MIN_ROLES) break;
      if (!roles.includes(r)) roles.push(r);
    }
    return { ...m, typical_roles: roles.slice(0, MAX_ROLES) };
  });
  return obj as DiagnosisPayload;
}

/** 真实大模型调用（配置 key 时启用） */
async function callRealLLM(text: string): Promise<DiagnosisPayload> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ baseURL: LLM_BASE_URL, apiKey: LLM_API_KEY });
  const kbText = [
    'NEW_ENERGY_STORAGE',
    'SMART_CONSTRUCTION_BIM',
    'ENGINEERING_B2B_OVERSEAS',
  ]
    .map((c) => {
      const k = (
        {
          NEW_ENERGY_STORAGE: '工商业储能',
          SMART_CONSTRUCTION_BIM: '智能建造/BIM',
          ENGINEERING_B2B_OVERSEAS: '工程出海B2B',
        } as const
      )[c as 'NEW_ENERGY_STORAGE'];
      return `赛道 ${c}（${k}）`;
    })
    .join('；');

  const completion = await client.chat.completions.create(
    {
      model: MODEL_NAME,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `你是工程人转型顾问。基于用户脱敏履历，输出严格符合架构的 JSON。
允许赛道仅限：NEW_ENERGY_STORAGE, SMART_CONSTRUCTION_BIM, ENGINEERING_B2B_OVERSEAS。
必须恰好 3 条 track_matches（每条 reasons 2-4 条，source_quote 必须逐字出自履历原文）。
每个赛道的 typical_roles 必须至少 3 个、建议 3-5 个，且为贴近 BOSS直聘 等平台真实在招的岗位名。
transferable_skills 5-8 条；top_gaps 2 条；learning_path 3 段（顺序固定 0-1m,1-3m,3-6m）；rewrite_samples 3 条。
赛道背景：${kbText}`,
        },
        { role: 'user', content: text },
      ],
    },
    { timeout: 25000 },
  );
  const content = completion.choices[0]?.message?.content ?? '{}';
  const json = JSON.parse(content);
  // 大模型若只回 2 个岗位，用知识库补齐到 ≥3 后再过校验闸门，避免整次诊断失败
  return DiagnosisPayloadSchema.parse(padTypicalRoles(json));
}

/** 主入口：生成 SSE 事件流 */
export async function* runDiagnosis(
  req: DiagnosisRequest,
  sessionId: string,
): AsyncGenerator<DiagnosisEvent> {
  const resultId = crypto.randomUUID();
  yield { event: 'accepted', data: { result_id: resultId, session_id: sessionId } };

  // 服务端只信任客户端脱敏后的文本（Spec §8.5 硬约束），两种模式均来自 sanitized_text
  const text = req.sanitized_text ?? '';
  const report = req.sanitize_report ?? emptyReport();

  if (report.injection_hits > 0 || /ignore previous|disregard|system prompt|jailbreak/i.test(text)) {
    yield { event: 'failed', data: { code: 4003, message: '检测到非常规指令，已终止本次诊断。' } };
    return;
  }

  yield { event: 'progress', data: { stage: 'extracting', percent: 15 } };

  let payload: DiagnosisPayload;
  try {
    if (HAS_LLM) {
      payload = await callRealLLM(text);
    } else {
      await sleep(120);
      payload = padTypicalRoles(buildHeuristic(text, report));
    }
  } catch (e) {
    const code = (e as { code?: number }).code ?? 4002;
    yield { event: 'failed', data: { code, message: '诊断生成失败，请稍后重试或留下邮箱异步接收。' } };
    return;
  }

  yield { event: 'skills', data: { transferable_skills: payload.transferable_skills } };
  yield { event: 'progress', data: { stage: 'matching', percent: 55 } };
  await sleep(80);
  yield { event: 'matches', data: { track_matches: payload.track_matches, top_gaps: payload.top_gaps } };
  yield { event: 'progress', data: { stage: 'path', percent: 80 } };
  await sleep(80);
  yield {
    event: 'path',
    data: { learning_path: payload.learning_path, rewrite_samples: payload.rewrite_samples },
  };
  yield {
    event: 'done',
    data: { result_id: resultId, status: 'completed', out_of_scope: payload.out_of_scope },
  };

  pendingResults.set(resultId, payload);
}
