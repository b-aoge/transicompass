/**
 * LLM 供应商适配（ADR-004）。
 *
 * 主：阿里云百炼 DashScope（OpenAI 兼容协议）
 * 备：DeepSeek
 * 两家均为境内已备案模型。境外模型直连在合规前置阶段就被排除，不留后门开关。
 *
 * 这一层只负责「发一次请求、拿回文本」，重试、降级、校验由 gateway.ts 编排。
 */

export type ProviderId = 'dashscope' | 'deepseek' | 'mock';

export interface ProviderConfig {
  id: ProviderId;
  baseUrl: string;
  apiKey: string;
}

export interface ChatRequest {
  model: string;
  system: string;
  user: string;
  timeoutMs: number;
  /** 温度固定 0.1、top_p 0.7（Spec 9.4 稳定性保障），不开放给调用方随意改 */
  maxTokens?: number;
}

export interface ChatResult {
  text: string;
  provider: ProviderId;
  model: string;
  durationMs: number;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class LlmError extends Error {
  readonly provider: ProviderId;
  readonly kind: 'timeout' | 'http' | 'network' | 'empty';

  constructor(kind: LlmError['kind'], provider: ProviderId, message: string) {
    super(message);
    this.name = 'LlmError';
    this.kind = kind;
    this.provider = provider;
  }
}

const TEMPERATURE = 0.1;
const TOP_P = 0.7;

export function resolvePrimary(): ProviderConfig | null {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;
  return {
    id: 'dashscope',
    baseUrl:
      process.env.DASHSCOPE_BASE_URL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey,
  };
}

export function resolveFallback(): ProviderConfig | null {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return {
    id: 'deepseek',
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
    apiKey,
  };
}

export function isMockForced(): boolean {
  return process.env.LLM_FORCE_MOCK === 'true';
}

/** 主备 Key 均未配置时走确定性 mock，保证本地端到端可跑通。 */
export function shouldUseMock(): boolean {
  return isMockForced() || (!resolvePrimary() && !resolveFallback());
}

interface OpenAiCompatibleResponse {
  choices?: { message?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * 两家供应商都走 OpenAI 兼容的 /chat/completions，
 * 差异只在 baseUrl、模型名与是否支持 response_format。
 */
export async function callChat(
  config: ProviderConfig,
  req: ChatRequest,
): Promise<ChatResult> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        temperature: TEMPERATURE,
        top_p: TOP_P,
        max_tokens: req.maxTokens ?? 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new LlmError(
        'http',
        config.id,
        `供应商返回 HTTP ${String(response.status)}`,
      );
    }

    const body = (await response.json()) as OpenAiCompatibleResponse;
    const text = body.choices?.[0]?.message?.content ?? '';
    if (!text.trim()) {
      throw new LlmError('empty', config.id, '供应商返回空内容');
    }

    return {
      text,
      provider: config.id,
      model: req.model,
      durationMs: Date.now() - startedAt,
      ...(body.usage ? { usage: body.usage } : {}),
    };
  } catch (err) {
    if (err instanceof LlmError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new LlmError('timeout', config.id, `调用超时（${String(req.timeoutMs)}ms）`);
    }
    throw new LlmError('network', config.id, '网络调用失败');
  } finally {
    clearTimeout(timer);
  }
}
