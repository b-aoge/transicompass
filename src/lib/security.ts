import crypto from 'node:crypto';
import { ENCRYPTION_KEY_B64 } from './env';

/**
 * 字段级加密（Spec §10 隐私合规）。
 * AES-256-GCM：认证加密，附带 96 位 IV 与 128 位 tag。
 * 密钥来自 ENCRYPTION_KEY(32 字节 base64)。IV 每次随机，与密文一同存储。
 */

function getKey(): Buffer {
  const buf = Buffer.from(ENCRYPTION_KEY_B64, 'base64');
  if (buf.length !== 32) {
    throw new Error('ENCRYPTION_KEY 必须为 base64 编码的 32 字节密钥');
  }
  return buf;
}

export function encrypt(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // 格式：base64(iv).base64(tag).base64(ciphertext)
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('密文格式非法');
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

/**
 * 客户端 PII 脱敏的「服务端兜底」同源实现（Spec §8.5）。
 * 即便客户端已脱敏，服务端再跑一遍同规则，确保入库前零原文。
 * 返回脱敏文本 + 计数报告（不含任何原文片段）。
 */
const PII_PATTERNS: { key: keyof SanitizeCount; re: RegExp }[] = [
  { key: 'phone', re: /(?<!\d)(1[3-9]\d{9})(?!\d)/g },
  { key: 'idcard', re: /(?<!\d)(\d{17}[\dXx]|\d{15})(?!\d)/g },
  { key: 'email', re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { key: 'url', re: /https?:\/\/[^\s]+/g },
  { key: 'company', re: /(公司|集团|有限|股份|局|院|事务所)名称/g },
];

interface SanitizeCount {
  name: number;
  phone: number;
  email: number;
  idcard: number;
  company: number;
  project: number;
  url: number;
  injection_hits: number;
}

export function sanitizeServerSide(text: string): {
  text: string;
  report: SanitizeCount;
} {
  let out = text;
  const report: SanitizeCount = {
    name: 0,
    phone: 0,
    email: 0,
    idcard: 0,
    company: 0,
    project: 0,
    url: 0,
    injection_hits: 0,
  };
  for (const { key, re } of PII_PATTERNS) {
    out = out.replace(re, (m) => {
      report[key] += 1;
      return `[${key === 'phone' ? '电话' : key === 'email' ? '邮箱' : key === 'idcard' ? '证件号' : key === 'url' ? '链接' : '机构'}]`;
    });
  }
  // 常见姓名（2-3 字中文，前后为边界）粗略遮盖
  out = out.replace(/(?<![一-龥])[一-龥]{2,3}(?=[，。、\s]|$)/g, (m) => {
    if (/^(先生|女士|项目|公司|工程|我们|负责|担任|从事)$/.test(m)) return m;
    report.name += 1;
    return '[姓名]';
  });
  // 提示词注入检测：出现角色扮演/系统指令特征
  const injRe = /(忽略|无视|忽视).{0,8}(上述|以上|前面|指令|规则)|system\s*prompt|你是.{0,6}AI|扮演|jailbreak/i;
  if (injRe.test(out)) report.injection_hits += 1;
  return { text: out, report };
}
