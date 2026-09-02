import { NextRequest } from 'next/server';
import { LeadRequestSchema } from '@/lib/validation/schemas';
import { getStore } from '@/lib/db';
import { readSessionId } from '@/lib/session';
import { ok, fail, ErrCode } from '@/lib/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * CTA 留资（Spec /lead，operationId submitLead）。
 * 刻意不要求登录——留资本身即转化动作。限流 3 次/小时/sid（内存计数演示）。
 */
const LIMIT = new Map<string, { count: number; resetAt: number }>();
function rateOk(key: string): boolean {
  const now = Date.now();
  const e = LIMIT.get(key);
  if (!e || e.resetAt < now) {
    LIMIT.set(key, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (e.count >= 3) return false;
  e.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = LeadRequestSchema.safeParse(body);
  if (!parsed.success) return fail(ErrCode.PARAM_INVALID, parsed.error.issues[0]?.message ?? '留资参数非法');
  const data = parsed.data;

  const sid = await readSessionId();
  if (sid && !rateOk(`lead:${sid}`)) return fail(ErrCode.RATE_LIMITED, '留资过于频繁，请稍后再试', 200);

  const store = getStore();
  const { id, ctaType, nextAction } = store.saveLead({
    resultId: data.result_id ?? null,
    sessionId: sid,
    req: data,
  });
  return ok({ lead_id: id, cta_type: ctaType, next_action: nextAction });
}
