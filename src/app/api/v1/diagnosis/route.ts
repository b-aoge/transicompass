import { NextRequest, NextResponse } from 'next/server';
import { DiagnosisRequestSchema } from '@/lib/validation/schemas';
import { runDiagnosis, pendingResults, type DiagnosisEvent } from '@/lib/llm';
import { getStore, toResultView } from '@/lib/db';
import { readSessionId, SID_COOKIE, sessionCookieOpts } from '@/lib/session';
import { fail, ErrCode } from '@/lib/response';
import { readUserId } from '@/lib/auth';
import { consumeUserQuota, consumeAnonQuota } from '@/lib/quota';
import { mapIssueToCode, lengthHint } from '@/lib/validation/issue-mapper';
import { logger } from '@/lib/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(ErrCode.PARAM_INVALID, '请求体格式非法');
  }

  const parsed = DiagnosisRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail(ErrCode.PARAM_INVALID, parsed.error.issues[0]?.message ?? '参数校验失败');
  }
  const data = parsed.data;

  const store = getStore();
  let sid = await readSessionId();
  let isNewSession = false;
  if (!sid || !store.getSession(sid)) {
    const s = store.createSession();
    sid = s.id;
    isNewSession = true;
  }

  // 免费额度闸门：注册用户按 user_id（跨设备累计，每 30 天 9 次），匿名按浏览器 sid（3 次）
  const userId = await readUserId(req);
  const quota = userId
    ? await consumeUserQuota(userId)
    : await consumeAnonQuota(sid);
  if (!quota.ok) {
    return fail(ErrCode.QUOTA_EXHAUSTED);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: DiagnosisEvent) =>
        controller.enqueue(encoder.encode(`event: ${ev.event}\ndata: ${JSON.stringify(ev.data)}\n\n`));
      try {
        for await (const ev of runDiagnosis(data, sid!)) {
          send(ev);
          if (ev.event === 'done') {
            const payload = pendingResults.get(ev.data.result_id);
            if (payload) {
              store.saveResult({
                sessionId: sid!,
                payload,
                status: ev.data.status === 'degraded' ? 'degraded' : 'completed',
                outOfScope: ev.data.out_of_scope,
                rawText: data.input_type === 'resume' ? data.sanitized_text : undefined,
              });
              pendingResults.delete(ev.data.result_id);
            }
          }
        }
      } catch (e) {
        logger().error({ err: (e as Error).message }, 'diagnosis stream error');
        controller.enqueue(
          encoder.encode(
            `event: failed\ndata: ${JSON.stringify({ code: ErrCode.SERVER, message: '服务异常，请稍后重试' })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  const headers = new Headers({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const res = new NextResponse(stream, { headers, status: 200 });
  if (isNewSession && sid) {
    res.cookies.set(SID_COOKIE, sid, sessionCookieOpts());
  }
  return res;
}

// 让 TS 知道 toResultView 被引用（共享视图在 results/[id] 使用）
void toResultView;
