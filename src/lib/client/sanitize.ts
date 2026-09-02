/**
 * 客户端 PII 脱敏（Spec §8.5 硬约束：服务端不接收文件与原文）。
 * 在浏览器内完成解析与脱敏，仅上送 sanitized_text。返回脱敏文本 + 计数报告，
 * 报告不含任何原文片段，用于合规展示「已处理 N 处敏感信息」。
 */

export interface SanitizeReport {
  name: number;
  phone: number;
  email: number;
  idcard: number;
  company: number;
  project: number;
  url: number;
  injection_hits: number;
}

const NAME_STOP = /^(先生|女士|项目|公司|工程|我们|负责|担任|从事|总监|经理|工程师)$/;

export function sanitizePII(text: string): { text: string; report: SanitizeReport } {
  let out = text;
  const report: SanitizeReport = {
    name: 0,
    phone: 0,
    email: 0,
    idcard: 0,
    company: 0,
    project: 0,
    url: 0,
    injection_hits: 0,
  };

  out = out.replace(/(?<!\d)(1[3-9]\d{9})(?!\d)/g, () => {
    report.phone += 1;
    return '[电话]';
  });
  out = out.replace(/(?<!\d)(\d{17}[\dXx]|\d{15})(?!\d)/g, () => {
    report.idcard += 1;
    return '[证件号]';
  });
  out = out.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, () => {
    report.email += 1;
    return '[邮箱]';
  });
  out = out.replace(/https?:\/\/[^\s]+/g, () => {
    report.url += 1;
    return '[链接]';
  });
  out = out.replace(/(公司|集团|有限|股份|局|院|事务所)名称/g, () => {
    report.company += 1;
    return '[机构]';
  });
  out = out.replace(/(?<![一-龥])[一-龥]{2,3}(?=[，。、\s]|$)/g, (m) => {
    if (NAME_STOP.test(m)) return m;
    report.name += 1;
    return '[姓名]';
  });

  if (/忽略|无视|忽视/.test(out) && /(上述|以上|前面|指令|规则)/.test(out)) {
    report.injection_hits += 1;
  }
  return { text: out, report };
}
