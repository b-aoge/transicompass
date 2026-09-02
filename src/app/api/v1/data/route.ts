import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/db';
import { readSessionId } from '@/lib/session';
import { ok, fail, ErrCode } from '@/lib/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 即时删除用户数据（Spec /data，operationId deleteMyData）。
 * scope=session 同步物理删除本次会话数据；scope=all 需登录（MVP 演示未启用）。
 * leads（主动留资）不在删除范围内，响应显式告知并提供人工通道。
 */
const Body = z.object({
  scope: z.enum(['session', 'all']).default('session'),
  confirm: z.literal(true),
});

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(body);
  if (!parsed.success) return fail(ErrCode.PARAM_INVALID, '必须 confirm=true');
  const { scope } = parsed.data;

  const store = getStore();
  const sid = await readSessionId();

  if (scope === 'session') {
    if (!sid) return fail(ErrCode.UNAUTH, '无会话可删除');
    const deleted = store.deleteSession(sid);
    return ok({
      scope,
      deleted_at: new Date().toISOString(),
      deleted,
      retained: {
        leads: 0,
        reason: '主动留资（社群/1v1）独立于诊断数据，需通过人工通道删除',
      },
    });
  }

  return fail(ErrCode.UNAUTH, '全量删除需登录账号后操作（演示版未启用短信登录）', 200);
}
