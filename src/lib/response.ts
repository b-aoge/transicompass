import { NextResponse } from 'next/server';
import { API_CODE, API_CODE_MESSAGE } from './types/codes';
import type { ApiCode } from './types/codes';
import type { ApiEnvelope } from './types/api';

/**
 * 统一响应封装（openapi ApiEnvelope）。
 * 业务错误一律 HTTP 200 + 非 0 code（规避微信/企业网对 4xx/5xx 的拦截）。
 * 仅网关级失败（限流 429、超大 body 413）返回真实状态码。
 */
export function ok<T>(data: T | null, message = ''): NextResponse {
  const body: ApiEnvelope<T> = { code: API_CODE.OK, data, message };
  return NextResponse.json(body);
}

/**
 * 业务错误：默认 HTTP 200（符合 Spec 7.1 约定）。
 * message 省略时取 API_CODE_MESSAGE 的中文用户文案——绝不把 zod 的英文
 * 校验信息直接抛给用户。
 */
export function fail(code: ApiCode, message?: string, status = 200): NextResponse {
  const body: ApiEnvelope<null> = {
    code,
    data: null,
    message: message ?? API_CODE_MESSAGE[code],
  };
  return NextResponse.json(body, { status });
}

/** 网关级错误：返回真实 HTTP 状态码（仅限流 429 与超大 body 413） */
export function failHttp(code: ApiCode, status: number, message?: string): NextResponse {
  const body: ApiEnvelope<null> = {
    code,
    data: null,
    message: message ?? API_CODE_MESSAGE[code],
  };
  return NextResponse.json(body, { status });
}

/** 限流是少数返回真实 4xx 的场景之一（Spec 7.1）。 */
export function failRateLimited(retryAfterSeconds?: number): NextResponse {
  const res = failHttp(API_CODE.RATE_LIMITED, 429);
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    res.headers.set('Retry-After', String(retryAfterSeconds));
  }
  return res;
}

/**
 * 业务错误码常量。直接绑定 API_CODE，键名保留调用方习惯的短名。
 * satisfies 保证任何一个值漂移或写错都会在编译期报错，不会等到线上才发现。
 */
export const ErrCode = {
  OK: API_CODE.OK,
  PARAM_INVALID: API_CODE.INVALID_PARAM,
  PRIVACY_NOT_ACCEPTED: API_CODE.CONSENT_REQUIRED,
  CONTENT_LENGTH: API_CODE.TEXT_LENGTH_OUT_OF_RANGE,
  OUT_OF_INDUSTRY: API_CODE.OUT_OF_INDUSTRY,
  UNAUTH: API_CODE.UNAUTHENTICATED,
  CODE_WRONG: API_CODE.AUTH_CODE_INVALID,
  FORBIDDEN: API_CODE.FORBIDDEN,
  RESUME_PARSE: API_CODE.RESUME_PARSE_FAILED,
  FILE_UNSUPPORTED: API_CODE.FILE_TOO_LARGE_OR_UNSUPPORTED,
  AI_UNAVAILABLE: API_CODE.AI_UNAVAILABLE,
  AI_OUTPUT_INVALID: API_CODE.AI_OUTPUT_INVALID,
  PROMPT_INJECTION: API_CODE.PROMPT_INJECTION_DETECTED,
  AI_TIMEOUT: API_CODE.AI_TIMEOUT,
  SHARE_NOT_FOUND: API_CODE.SHARE_NOT_FOUND_OR_EXPIRED,
  DATA_DELETED: API_CODE.DATA_DELETED,
  RATE_LIMITED: API_CODE.RATE_LIMITED,
  QUOTA_EXHAUSTED: API_CODE.QUOTA_EXHAUSTED,
  SERVER: API_CODE.INTERNAL_ERROR,
} as const satisfies Record<string, ApiCode>;
