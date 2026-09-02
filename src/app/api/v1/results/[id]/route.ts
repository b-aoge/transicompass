import { NextRequest, NextResponse } from 'next/server';
import { getStore, toResultView } from '@/lib/db';
import { readSessionId } from '@/lib/session';
import { ok, fail, ErrCode } from '@/lib/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 读取结果（Spec /results/{id}，operationId getResult）。
 * 三种身份：本人会话 / 已登录 JWT / 分享令牌（?share_token=）。
 * 分享令牌命中时 view_mode=shared（本实现 ResultView 不含敏感字段，无需额外剥离）。
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const store = getStore();
  const sid = await readSessionId();
  const shareToken = new URL(req.url).searchParams.get('share_token');

  if (shareToken && shareToken.length === 32) {
    const r = store.getShare(shareToken);
    if (r) return ok(toResultView(r, 'shared'));
  }

  if (sid) {
    const r = store.getResult(id);
    if (r && r.sessionId === sid) return ok(toResultView(r, 'owner'));
  }

  return fail(ErrCode.SHARE_NOT_FOUND, '结果不存在、已过期或无访问权限', 200);
}
