import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/db';
import { readSessionId } from '@/lib/session';
import { ok } from '@/lib/response';
import { TelemetryEventSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 批量埋点（Spec /events，operationId reportEvents）。
 * sendBeacon 友好：永远返回 code=0，埋点失败绝不影响主流程。
 * 非法事件静默丢弃；不采集简历原文 / IP / 完整 UA。
 */
const Body = z.object({
  events: z.array(TelemetryEventSchema).min(1).max(20),
  device: z.enum(['mobile', 'desktop', 'wechat']).optional(),
  app_version: z.string().max(16).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  const sid = await readSessionId();
  if (parsed.success && sid) {
    getStore().recordEvents(sid, parsed.data.events);
    logger().debug({ count: parsed.data.events.length }, 'telemetry accepted');
  }
  return ok(null);
}
