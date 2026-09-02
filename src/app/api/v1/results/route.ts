import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/db';
import { readSessionId } from '@/lib/session';
import { ok, fail, ErrCode } from '@/lib/response';
import { RETENTION_DAYS } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 保存结果（Spec /results，operationId saveResult）。
 * Spec 要求 jwtCookie；MVP 演示放宽到匿名会话归属（结果本就挂在会话下），
 * 后续接入短信登录后改为 JWT 认领。见 README 部署说明。
 */
const Body = z.object({ result_id: z.string().uuid(), title: z.string().max(40).optional() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(body);
  if (!parsed.success) return fail(ErrCode.PARAM_INVALID, '缺少合法的 result_id');

  const store = getStore();
  const sid = await readSessionId();
  const r = store.getResult(parsed.data.result_id);
  if (!r) return fail(ErrCode.SHARE_NOT_FOUND, '结果不存在或已过期');
  if (sid && r.sessionId !== sid) return fail(ErrCode.FORBIDDEN, '无权操作该结果');

  return ok({
    result_id: r.id,
    saved_at: r.createdAt.toISOString(),
    expires_at: new Date(r.createdAt.getTime() + RETENTION_DAYS * 86400_000).toISOString(),
  });
}
