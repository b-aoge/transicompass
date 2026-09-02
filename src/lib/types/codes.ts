/**
 * 业务错误码。唯一来源：openapi.yaml components.schemas.ApiEnvelope.code 的 enum。
 *
 * 传输约定（Spec 7.1）：业务错误一律 HTTP 200 + 非 0 code，
 * 规避微信内置浏览器与部分企业网络对 4xx/5xx 的拦截改写。
 * 只有网关级失败（限流 429、超大 body 413、未捕获异常 500）返回真实状态码。
 *
 * 本文件零运行时依赖，前端可直接 import。
 */

export const API_CODE = {
  OK: 0,

  INVALID_PARAM: 1001,
  CONSENT_REQUIRED: 1002,
  TEXT_LENGTH_OUT_OF_RANGE: 1003,
  OUT_OF_INDUSTRY: 1004,

  UNAUTHENTICATED: 2001,
  AUTH_CODE_INVALID: 2002,
  FORBIDDEN: 2003,

  RESUME_PARSE_FAILED: 3001,
  FILE_TOO_LARGE_OR_UNSUPPORTED: 3002,

  AI_UNAVAILABLE: 4001,
  AI_OUTPUT_INVALID: 4002,
  PROMPT_INJECTION_DETECTED: 4003,
  AI_TIMEOUT: 4004,

  SHARE_NOT_FOUND_OR_EXPIRED: 5001,
  DATA_DELETED: 5002,

  RATE_LIMITED: 6001,
  QUOTA_EXHAUSTED: 6002,
  INTERNAL_ERROR: 9000,
} as const;

export type ApiCodeKey = keyof typeof API_CODE;
export type ApiCode = (typeof API_CODE)[ApiCodeKey];

/**
 * 面向用户的中文可读描述，不含任何技术堆栈信息（Spec 7.1）。
 * 前端可覆写为更贴合场景的文案，但默认值必须能直接展示给用户。
 */
export const API_CODE_MESSAGE: Record<ApiCode, string> = {
  [API_CODE.OK]: '',
  [API_CODE.INVALID_PARAM]: '提交的内容有一处不符合要求，请检查后重试。',
  [API_CODE.CONSENT_REQUIRED]: '请先阅读并勾选隐私授权，我们才会开始处理您的经历文本。',
  [API_CODE.TEXT_LENGTH_OUT_OF_RANGE]: '经历描述需在 80 到 20000 字之间，请补充或精简。',
  [API_CODE.OUT_OF_INDUSTRY]: '这段内容看不出工程建设行业的从业经历，暂时无法给出诊断。',
  [API_CODE.UNAUTHENTICATED]: '该操作需要先完成手机号验证。',
  [API_CODE.AUTH_CODE_INVALID]: '验证码不正确或已过期，请重新获取。',
  [API_CODE.FORBIDDEN]: '这份结果不属于当前账号，无法查看。',
  [API_CODE.RESUME_PARSE_FAILED]: '这份文件没能读出文字，可能是扫描件或加密文档，建议改用表单填写。',
  [API_CODE.FILE_TOO_LARGE_OR_UNSUPPORTED]: '仅支持 10MB 以内的 PDF 或 DOCX 文件。',
  [API_CODE.AI_UNAVAILABLE]: '分析服务暂时无法响应，可以留下邮箱，生成后发给您。',
  [API_CODE.AI_OUTPUT_INVALID]: '这次分析的结果没有通过质量校验，我们不会把不可靠的结论交给您。',
  [API_CODE.PROMPT_INJECTION_DETECTED]: '输入中包含异常指令内容，请检查后重试。',
  [API_CODE.AI_TIMEOUT]: '分析耗时超过了预算，可以留下邮箱，生成后发给您。',
  [API_CODE.SHARE_NOT_FOUND_OR_EXPIRED]: '这个分享链接不存在或已经过期。',
  [API_CODE.DATA_DELETED]: '该数据已按您的要求删除。',
  [API_CODE.RATE_LIMITED]: '请求过于频繁，请稍后再试。',
  [API_CODE.QUOTA_EXHAUSTED]: '免费诊断额度已用完，每 30 天会刷新一次，或注册账号后继续使用。',
  [API_CODE.INTERNAL_ERROR]: '服务出现异常，请稍后重试。',
};

const CODE_VALUES: readonly number[] = Object.values(API_CODE);

export function isApiCode(value: unknown): value is ApiCode {
  return typeof value === 'number' && CODE_VALUES.includes(value);
}
