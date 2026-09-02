/**
 * 环境变量单一出入口（Spec §附录A）。
 * 所有读取集中在此，避免散落 process.env。未配置时给出本地演示安全默认值。
 */

function str(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

/** 是否启用真实 PostgreSQL 持久化（配置 DATABASE_URL 即启用） */
export const HAS_DATABASE = Boolean(process.env.DATABASE_URL);

/** 是否启用真实大模型（配置任意兼容 OpenAI 的 base url + key 即启用） */
export const LLM_BASE_URL = str(
  'DASHSCOPE_BASE_URL',
  'https://dashscope.aliyuncs.com/compatible-mode/v1',
);
export const LLM_API_KEY = process.env.DASHSCOPE_API_KEY ?? '';
export const HAS_LLM = LLM_API_KEY.length > 0;
export const MODEL_NAME = str('MODEL_NAME', 'qwen-plus');

/** 生成式人工智能服务登记编号（合规公示，宝哥部署前必填） */
export const REGISTRATION_NO = str('GENERATED_AI_REG_NO', '').trim();

/** 对外基础地址，用于拼分享链接 */
export const APP_BASE_URL = str('APP_BASE_URL', 'http://localhost:3000');

/** 隐私政策版本（与前端勾选框一致） */
export const POLICY_VERSION = str('PRIVACY_POLICY_VERSION', '2026-08-01');

/** 字段加密密钥：32 字节 base64。本地演示用确定性开发密钥，生产必须替换 */
const DEV_ENC_KEY = 'Z2h9Kp2mQ4x7bV8nW3cR5tY6uA1sD0eF9hJ2kL4mN8=';
export const ENCRYPTION_KEY_B64 = str('ENCRYPTION_KEY', DEV_ENC_KEY);

/** 会话/分享令牌签名密钥 */
const DEV_JWT_SECRET = 'transicompass-dev-jwt-secret-2026';
export const JWT_SECRET = str('JWT_SECRET', DEV_JWT_SECRET);

/** 结果保留 30 天；分享 7 天；匿名会话 30 天（与 Spec / openapi 一致） */
export const RETENTION_DAYS = 30;
export const SHARE_DAYS = 7;
export const SESSION_DAYS = 30;

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && HAS_DATABASE;
}
