/**
 * 确定性 mock 生成器。
 *
 * 两个用途：
 *   1. 主备 API Key 均未配置时（本地开发 / CI），让端到端链路可跑通
 *   2. LLM_FORCE_MOCK=true 时做回归测试
 *
 * 关键约束：输出随 sanitized_text 变化，不是写死数据（Spec T5 反写死验证），
 * 且同一输入必得同一输出（Spec T4 反随机性验证）。
 * 所有 source_quote / source_snippet 均逐字取自输入文本。
 */

import { CAPABILITY_MAP } from '@/lib/knowledge/capability-map';
import { assessRelevance, rankTracks } from '@/lib/knowledge/relevance';
import type {
  DiagnosisPayload,
  Gap,
  PathStage,
  RewriteSample,
  TrackCode,
  TrackMatch,
  TransferableSkill,
} from '@/lib/types/domain';

import { extractSnippets, pickSnippet, stableHash } from './snippets';

const SKILL_TEMPLATES: readonly { name: string; description: string }[] = [
  { name: '项目全周期管理', description: '能独立把控进度、成本与质量三条主线，在多方交叉作业下推进节点交付。' },
  { name: '技术方案编制', description: '能把现场约束翻译成可执行的施工与技术方案，并在评审中为方案辩护。' },
  { name: '多方协调与谈判', description: '在业主、监理、分包与供应商之间推动决策落地，处理界面争议。' },
  { name: '成本与合约控制', description: '熟悉工程量清单与变更签证逻辑，能在合约框架内守住利润空间。' },
  { name: '现场问题处置', description: '面对突发工况能快速定位原因并给出可落地的补救措施，控制返工损失。' },
  { name: '团队组建与带教', description: '带过成建制的项目团队，能把个人经验沉淀成可复用的作业标准。' },
  { name: '标准与合规执行', description: '熟悉行业规范与验收流程，能把合规要求前置到施工组织中。' },
];

const GAP_TEMPLATES: readonly Omit<Gap, 'why_it_matters'>[] = [
  { gap_name: '目标赛道技术底座', closing_action: '用两周时间通读目标赛道的一份完整技术标，逐章标注看不懂的术语并逐个查证。' },
  { gap_name: '可对外展示的作品', closing_action: '把过往一个项目按目标赛道的语言重写成一份技术方案，投给同行要一次真实点评。' },
  { gap_name: '行业人脉入口', closing_action: '锁定三家目标企业，通过公开渠道找到在职同行做一次三十分钟的信息访谈。' },
];

function buildSkills(snippets: string[], seed: number): TransferableSkill[] {
  const count = 5 + (seed % 3);
  const result: TransferableSkill[] = [];
  for (let i = 0; i < count; i += 1) {
    const template = SKILL_TEMPLATES[i % SKILL_TEMPLATES.length];
    if (!template) continue;
    const quote = pickSnippet(snippets, seed, i);
    if (quote.length < 4) continue;
    result.push({
      name: template.name,
      description: template.description,
      strength: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
      source_quote: quote,
      evidence: [
        {
          source_snippet: quote,
          why: `这段经历直接体现了${template.name}，是判断该能力可迁移的依据。`,
        },
      ],
    });
  }
  return result;
}

function buildMatches(snippets: string[], seed: number, ranked: TrackCode[]): TrackMatch[] {
  return ranked.map((code, rank) => {
    const knowledge = CAPABILITY_MAP[code];
    const score = Math.max(18, 82 - rank * 21 - (seed % 7));
    const reasons = [0, 1].map((offset) => {
      const quote = pickSnippet(snippets, seed, rank * 3 + offset);
      const capability =
        knowledge.core_capabilities[(rank + offset) % knowledge.core_capabilities.length] ??
        knowledge.core_capabilities[0] ??
        '工程管理';
      const source = knowledge.transferable_from[offset % knowledge.transferable_from.length];
      return {
        source_quote: quote,
        mapped_capability: capability,
        target_scenario: `${knowledge.name}中的${capability}岗位场景，${source ? source.why.slice(0, 40) : '经验结构相近'}`,
      };
    });

    return {
      track_code: code,
      match_score: score,
      match_level: score >= 65 ? 'high' : score >= 40 ? 'medium' : 'low',
      reasons,
      typical_roles: knowledge.typical_roles.slice(0, 5),
      caveat: knowledge.caveat,
    };
  });
}

function buildGaps(top: TrackCode): Gap[] {
  const knowledge = CAPABILITY_MAP[top];
  return GAP_TEMPLATES.slice(0, 2).map((template, i) => ({
    gap_name: template.gap_name,
    why_it_matters: `${knowledge.name}的用人方普遍关注${knowledge.common_gaps[i] ?? knowledge.common_gaps[0] ?? '行业基础'}，缺这块会在初筛环节被直接过滤。`,
    closing_action: template.closing_action,
  }));
}

function buildPath(top: TrackCode): PathStage[] {
  const knowledge = CAPABILITY_MAP[top];
  const role = knowledge.typical_roles[0] ?? '目标岗位';
  return [
    {
      stage: '0-1m',
      deliverable: `完成一份${knowledge.name}方向的岗位能力对照表，逐条标注自己已具备与待补的项`,
      why_this_deliverable: '先把差距量化出来，后面两个月的投入才有靶子，不至于泛泛地学。',
      verifiable_artifact: '一份可发给同行评审的对照表',
    },
    {
      stage: '1-3m',
      deliverable: `独立产出一份${knowledge.name}项目的技术方案或投标文件片段，覆盖${knowledge.core_capabilities[0] ?? '核心环节'}`,
      why_this_deliverable: '这是面试时唯一能证明你真做过的东西，比任何证书都有说服力。',
      verifiable_artifact: '一份完整的技术方案文档',
    },
    {
      stage: '3-6m',
      deliverable: `围绕${role}岗位完成一次真实项目参与或深度案例复盘，形成可写进简历的成果条目`,
      why_this_deliverable: '把练习转成可核查的履历条目，才算真正完成从准备到入场的这一步。',
      verifiable_artifact: '一条可被追问细节的简历条目',
    },
  ];
}

function buildRewrites(snippets: string[], seed: number, ranked: TrackCode[]): RewriteSample[] {
  return ranked.map((code, i) => {
    const knowledge = CAPABILITY_MAP[code];
    const original = pickSnippet(snippets, seed, 11 + i);
    const capability = knowledge.core_capabilities[0] ?? '核心能力';
    return {
      target_track_code: code,
      original: original.length >= 6 ? original : `${original}（原表述）`,
      rewritten: `${original.slice(0, 60)}，对应${knowledge.name}的${capability}要求`,
      what_changed: `把通用工程表述换成${knowledge.name}招聘方在用的岗位语言`,
    };
  });
}

export function generateMockPayload(sanitizedText: string): DiagnosisPayload {
  const seed = stableHash(sanitizedText);
  const snippets = extractSnippets(sanitizedText);
  const relevance = assessRelevance(sanitizedText);
  const ranked = rankTracks(relevance);
  const top = ranked[0] ?? 'NEW_ENERGY_STORAGE';
  const outOfScope = !relevance.relevant;

  return {
    out_of_scope: outOfScope,
    out_of_scope_reason: outOfScope
      ? '这段经历中没有出现工程建设行业的关键特征，三个赛道的匹配度都仅供参考。'
      : null,
    summary: outOfScope
      ? '从这段描述中没能识别出明确的工程建设行业经历，以下三个赛道的评估结论置信度较低，建议补充项目与岗位细节后重新诊断。'
      : `你的经历主要沉淀在工程项目一线，与${CAPABILITY_MAP[top].name}的岗位要求存在可迁移的交集，下面逐条列出依据与差距。`,
    transferable_skills: buildSkills(snippets, seed),
    track_matches: buildMatches(snippets, seed, ranked),
    top_gaps: buildGaps(top),
    learning_path: buildPath(top),
    rewrite_samples: buildRewrites(snippets, seed, ranked),
  };
}
