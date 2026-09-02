import { NextRequest } from 'next/server';
import { getStore, toResultView } from '@/lib/db';
import { ok, fail, ErrCode } from '@/lib/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 分享令牌解析（Spec /results/{id}?share_token= 的纯令牌便捷端点）。
 * 命中返回共享视图（view_mode=shared）。
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (token.length !== 32) return fail(ErrCode.SHARE_NOT_FOUND, '分享链接无效', 200);
  const r = getStore().getShare(token);
  if (!r) return fail(ErrCode.SHARE_NOT_FOUND, '分享链接不存在或已过期', 200);
  return ok(toResultView(r, 'shared'));
}
