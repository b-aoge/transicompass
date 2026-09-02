/**
 * 从脱敏文本里切出可作为佐证的原句片段。
 *
 * 这些片段必须逐字出自原文——这是 PIPL 第 24 条说明权的落点，
 * 也是 Spec T3 会逐条抽查的断言项。任何改写都会让「依据」变成新的编造。
 */

const SPLIT_PATTERN = /[。；！？\n]+/;
const MIN_LEN = 6;
const MAX_LEN = 110;

/** FNV-1a，用于把文本映射成确定性的选择序号。同输入必得同输出。 */
export function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function extractSnippets(text: string): string[] {
  const parts = text
    .split(SPLIT_PATTERN)
    .map((s) => s.replace(/^[\s，、,]+|[\s，、,]+$/g, ''))
    .filter((s) => s.length >= MIN_LEN);

  const sized: string[] = [];
  for (const part of parts) {
    if (part.length <= MAX_LEN) {
      sized.push(part);
      continue;
    }
    // 过长句子按 MAX_LEN 切段，切出来的仍是原文连续子串
    for (let i = 0; i < part.length; i += MAX_LEN) {
      const chunk = part.slice(i, i + MAX_LEN);
      if (chunk.length >= MIN_LEN) sized.push(chunk);
    }
  }

  if (sized.length > 0) return sized;

  // 极端兜底：整段无标点时按定长切，仍保证逐字出自原文
  const fallback: string[] = [];
  for (let i = 0; i < text.length; i += 40) {
    const chunk = text.slice(i, i + 40).trim();
    if (chunk.length >= MIN_LEN) fallback.push(chunk);
  }
  return fallback.length > 0 ? fallback : [text.slice(0, Math.min(40, text.length))];
}

/**
 * 确定性取片段：同一 seed 恒取同一条，不同 seed 尽量取不同条。
 * 用取模而不是随机数，是为了满足 T4「同输入结果稳定」。
 */
export function pickSnippet(snippets: string[], seed: number, offset: number): string {
  if (snippets.length === 0) return '';
  const index = (seed + offset * 7919) % snippets.length;
  return snippets[index] ?? snippets[0] ?? '';
}

/** 校验片段是否逐字出自原文，用于对模型输出做反向抽查。 */
export function isVerbatim(snippet: string, source: string): boolean {
  if (!snippet) return false;
  return source.includes(snippet);
}
