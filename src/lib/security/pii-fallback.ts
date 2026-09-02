/**
 * 服务端二次脱敏兜底（Spec 8.5.1 第 ⑤ 步）。
 *
 * 前端脱敏保证「正常用户的原文不出浏览器」；
 * 本文件保证「绕过前端直连 API 的异常请求也不会把 PII 送进模型」。
 * 两者是不同的威胁模型，不能互相替代。
 *
 * 刻意保留的信息：从业年限、职位、专业学历、项目规模量词、技术栈证书、省级地域。
 * 这些是给出有价值诊断的前提，脱掉就没法诊断了。
 */

export interface PiiFallbackResult {
  text: string;
  counts: {
    name: number;
    phone: number;
    email: number;
    idcard: number;
    company: number;
    project: number;
    url: number;
  };
}

interface Rule {
  key: keyof PiiFallbackResult['counts'];
  pattern: RegExp;
  placeholder: string;
}

// 顺序有讲究：先长后短，先精确后模糊，避免身份证被手机号规则先啃掉一段
const RULES: readonly Rule[] = [
  {
    key: 'email',
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    placeholder: '[邮箱]',
  },
  {
    key: 'idcard',
    pattern: /(?<!\d)(\d{17}[\dXx]|\d{15})(?!\d)/g,
    placeholder: '[身份证号]',
  },
  {
    key: 'url',
    pattern: /https?:\/\/[^\s，。；、）)]+/g,
    placeholder: '[链接]',
  },
  {
    key: 'phone',
    pattern: /(?<!\d)1[3-9](?:[\s-]?\d){9}(?!\d)/g,
    placeholder: '[手机号]',
  },
];

const COMPANY_SUFFIX =
  '(?:有限公司|股份有限公司|集团有限公司|集团|建工|建设|工程局|设计院|研究院|分公司|项目部|事业部)';
const PROJECT_SUFFIX = '(?:花园|府邸|一期|二期|三期|广场|大厦|中心|新城|小区)';

// 公司名/项目名：后缀词典 + 前置 2-12 个非标点字符，避免吞掉整句
const COMPANY_PATTERN = new RegExp(`[^\\s，。；、（）()\\[\\]]{2,12}${COMPANY_SUFFIX}`, 'g');
const PROJECT_PATTERN = new RegExp(`[^\\s，。；、（）()\\[\\]]{2,12}${PROJECT_SUFFIX}`, 'g');

const PLACEHOLDER_GUARD = /\[[^\]]{1,12}\]/g;

function letterFor(index: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (index < alphabet.length) return alphabet.charAt(index);
  return String(index + 1);
}

/**
 * 编号一致性：同一实体全文映射到同一编号，模型才能理解「在同一家公司做了 8 年」。
 * 服务端只在本次请求的内存里维护映射，不落盘、不返回给客户端。
 */
function replaceEntities(
  text: string,
  pattern: RegExp,
  prefix: string,
): { text: string; count: number } {
  const registry = new Map<string, string>();
  pattern.lastIndex = 0;
  const replaced = text.replace(pattern, (match) => {
    // 已是占位符的片段不再二次替换
    if (match.startsWith('[') && match.endsWith(']')) return match;
    let token = registry.get(match);
    if (!token) {
      token = `[${prefix}${letterFor(registry.size)}]`;
      registry.set(match, token);
    }
    return token;
  });
  return { text: replaced, count: registry.size };
}

export function applyPiiFallback(input: string): PiiFallbackResult {
  let text = input;
  const counts = {
    name: 0,
    phone: 0,
    email: 0,
    idcard: 0,
    company: 0,
    project: 0,
    url: 0,
  };

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    const matches = text.match(rule.pattern);
    if (!matches) continue;
    counts[rule.key] += matches.length;
    rule.pattern.lastIndex = 0;
    text = text.replace(rule.pattern, rule.placeholder);
  }

  const company = replaceEntities(text, COMPANY_PATTERN, '公司');
  text = company.text;
  counts.company += company.count;

  const project = replaceEntities(text, PROJECT_PATTERN, '项目');
  text = project.text;
  counts.project += project.count;

  return { text, counts };
}

/**
 * 合规审计用：判断兜底是否真的抓到了客户端漏掉的 PII。
 * 抓到即说明客户端脱敏被绕过，端点应记录 error_occurred 埋点。
 */
export function countPlaceholders(text: string): number {
  const matches = text.match(PLACEHOLDER_GUARD);
  return matches ? matches.length : 0;
}
