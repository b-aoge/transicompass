/**
 * 提示词注入过滤（Spec 9.6 第二层）。
 *
 * 第一层结构性防护在 prompt 侧：用户文本包裹在 <user_resume> 标签内，
 * system prompt 声明标签内一律为数据。那才是主要手段，本文件是辅助。
 *
 * 处置策略刻意不粗暴拒绝，避免误杀正常简历：
 *   命中 1-2 条  -> 剥离命中片段，计入 injection_hits，继续诊断
 *   命中 >= 3 条 或 命中字符占比 > 5%  -> 判定阻断，端点返回 4003
 */

const INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
  /disregard\s+(the\s+)?(above|previous)/gi,
  /忽略(以上|上述|之前|前面)(的)?(所有)?(指令|要求|规则)/g,
  /(现在|从现在起)你(是|扮演|变成)/g,
  /重新(扮演|定义)(你的)?(角色|身份)/g,
  /<\/?(system|assistant|user)\s*>/gi,
  /\[\s*(system|INST)\s*\]/gi,
  /reveal\s+(your\s+)?(system\s+)?prompt/gi,
  /(输出|打印|告诉我)(你的)?(系统)?(提示词|prompt)/g,
  /<\/?user_resume\s*>/gi,
];

const BLOCK_HIT_THRESHOLD = 3;
const BLOCK_RATIO_THRESHOLD = 0.05;

export interface InjectionScanResult {
  /** 剥离命中片段后的文本，可安全送入模型 */
  cleaned: string;
  /** 命中的模式条数（不是命中次数） */
  hits: number;
  /** 被剥离的字符总数 */
  strippedChars: number;
  /** true 时端点应返回 4003 并阻断 */
  blocked: boolean;
}

export function scanForInjection(text: string): InjectionScanResult {
  let cleaned = text;
  let hits = 0;
  let strippedChars = 0;

  for (const pattern of INJECTION_PATTERNS) {
    // 每个 pattern 都带 g 标志，复用前必须重置 lastIndex
    pattern.lastIndex = 0;
    const matches = cleaned.match(pattern);
    if (!matches || matches.length === 0) continue;
    hits += 1;
    strippedChars += matches.reduce((sum, m) => sum + m.length, 0);
    pattern.lastIndex = 0;
    cleaned = cleaned.replace(pattern, ' ');
  }

  const ratio = text.length > 0 ? strippedChars / text.length : 0;
  const blocked = hits >= BLOCK_HIT_THRESHOLD || ratio > BLOCK_RATIO_THRESHOLD;

  return { cleaned, hits, strippedChars, blocked };
}

/**
 * 模型输出反向检查（Spec 9.6 末段）。
 * 输出里出现 system prompt 片段或标签残留，判为校验失败走修复链。
 */
const OUTPUT_LEAK_PATTERNS: readonly RegExp[] = [
  /你是面向中国工程建设行业从业者的转型分析引擎/,
  /<\/?user_resume\s*>/i,
  /\{\{\s*(CAPABILITY_MAP|JSON_SCHEMA_DESCRIPTION|SANITIZED_TEXT)\s*\}\}/,
  /^\s*system\s*:/im,
];

export function hasPromptLeak(output: string): boolean {
  return OUTPUT_LEAK_PATTERNS.some((p) => p.test(output));
}
