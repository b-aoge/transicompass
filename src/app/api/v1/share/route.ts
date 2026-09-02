import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/db';
import { readSessionId } from '@/lib/session';
import { ok, fail, ErrCode } from '@/lib/response';
import { APP_BASE_URL } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 生成 7 天只读分享链接（Spec /share）。
 * Spec 要求 jwtCookie；MVP 演示放宽到会话归属（匿名结果亦可分享，符合「免费不用注册」）。
 */
const Body = z.object({ result_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(body);
  if (!parsed.success) return fail(ErrCode.PARAM_INVALID, '缺少合法的 result_id');

  const store = getStore();
  const sid = await readSessionId();
  const r = store.getResult(parsed.data.result_id);
  if (!r) return fail(ErrCode.SHARE_NOT_FOUND, '结果不存在或已过期');
  if (sid && r.sessionId !== sid) return fail(ErrCode.FORBIDDEN, '无权操作该结果');

  const sh = store.createShare(r.id);
  return ok({
    share_token: sh.token,
    share_url: `${APP_BASE_URL}/s/${sh.token}`,
    expires_at: sh.expiresAt.toISOString(),
  });
}
