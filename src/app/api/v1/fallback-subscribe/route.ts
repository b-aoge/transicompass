import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, fail, ErrCode } from '@/lib/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * AI 失败降级——留邮箱异步接收（Spec /fallback-subscribe）。
 * 生产：写入 fallback_jobs，Worker 每 5 分钟重试并邮件推送。
 * 演示环境未启用异步邮件推送，返回明确状态。
 */
const Body = z.object({
  session_id: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(body);
  if (!parsed.success) return fail(ErrCode.PARAM_INVALID, '参数非法');
  return ok({
    subscribed: false,
    eta_minutes: 0,
    note: '演示环境未启用异步邮件推送；本会话内诊断已完成，可直接查看结果。',
  });
}
