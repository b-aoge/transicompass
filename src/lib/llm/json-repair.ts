/**
 * 模型输出的 JSON 解析与修复（Spec 9.3 校验与修复重试链的前两步）。
 *
 * 这里只做不花钱的本地修复：剥代码围栏、截取首尾大括号、去尾随逗号。
 * 本地修不好才轮到花一次模型调用的修复链，避免把预算烧在格式问题上。
 */

const FENCE_PATTERN = /^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/;

export function stripCodeFence(raw: string): string {
  const match = raw.match(FENCE_PATTERN);
  return match?.[1] ? match[1] : raw;
}

/** 截取第一个 { 到最后一个 } 之间的内容，丢掉模型爱加的前后寒暄。 */
function sliceOutermostObject(raw: string): string {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return raw;
  return raw.slice(start, end + 1);
}

/** 去掉 } 或 ] 之前的尾随逗号，这是模型最高频的语法错误。 */
function dropTrailingCommas(raw: string): string {
  return raw.replace(/,(\s*[}\]])/g, '$1');
}

export interface ParseOutcome {
  ok: boolean;
  value: unknown;
  error: string | null;
}

export function parseModelJson(raw: string): ParseOutcome {
  const candidates = [
    raw,
    stripCodeFence(raw),
    sliceOutermostObject(stripCodeFence(raw)),
    dropTrailingCommas(sliceOutermostObject(stripCodeFence(raw))),
  ];

  let lastError = '输出为空';
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    try {
      return { ok: true, value: JSON.parse(trimmed), error: null };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'JSON 解析失败';
    }
  }
  return { ok: false, value: null, error: lastError };
}
