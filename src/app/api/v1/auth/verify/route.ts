import { NextRequest } from 'next/server';
import { ok, fail, ErrCode } from '@/lib/response';
import {
  AUTH_DEMO,
  signUserId,
  authCookieOpts,
  AUTH_COOKIE,
} from '@/lib/auth';
import { ensureUser } from '@/lib/quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PHONE_RE = /^1[3-9]\d{9}$/;

/**
 * 校验验证码并签发 JWT（Spec /auth/verify）。
 * 演示版（AUTH_DEMO=true）：不校验验证码，按手机号定位/创建账号后下发登录态。
 * 生产能力：接入短信网关后，在此校验 code 后再 ensureUser。
 */
export async function POST(req: NextRequest) {
  if (!AUTH_DEMO) {
    return ok({
      enabled: false,
      message: '演示版未启用短信登录；结果保存、分享与留资均无需登录。',
    });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(ErrCode.PARAM_INVALID, '请求体格式非法');
  }
  const phone = (body as { phone?: unknown })?.phone;
  if (typeof phone !== 'string' || !PHONE_RE.test(phone)) {
    return fail(ErrCode.PARAM_INVALID, '手机号格式非法');
  }

  const user = await ensureUser(phone);
  if (!user) {
    return fail(ErrCode.SERVER, '注册服务暂不可用（未配置数据库）');
  }

  const token = await signUserId(user.id);
  const res = ok({
    enabled: true,
    demo: true,
    user_id: user.id,
    remaining_calls: user.remainingCalls,
  });
  res.cookies.set(AUTH_COOKIE, token, authCookieOpts());
  return res;
}
