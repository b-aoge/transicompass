/**
 * POST /api/v1/diagnosis 的浏览器端客户端。
 *
 * 三个契约要点（来自 Spec 7.1 / openapi servers / route.ts 实现）：
 *  1. 业务错误是 HTTP 200 + 非 0 code，**不能看 res.ok**，要看 body.code；
 *  2. 同一个 200 下，成功回 text/event-stream，校验失败回 application/json 信封，
 *     所以分流依据是 Content-Type 而不是状态码；
 *  3. 真 4xx 只有 429（限流）与 413（body 过大）两种。
 */

import {
  API_CODE,
  API_CODE_MESSAGE,
  SSE_EVENT_NAMES,
  isApiCode,
  type ApiCode,
  type ApiEnvelope,
  type DiagnosisRequest,
  type SseEvent,
} from '@/lib/types/api';

export const DIAGNOSIS_ENDPOINT = '/api/v1/diagnosis';

export interface DiagnosisFailure {
  code: ApiCode;
  message: string;
}

export type DiagnosisStream =
  | { ok: true; events: AsyncGenerator<SseEvent, void, undefined> }
  | { ok: false; failure: DiagnosisFailure };

/**
 * 文案一律取 API_CODE_MESSAGE，不直接展示服务端 message。
 * 因为 1001 时服务端回的是 zod issue 原文（英文、含字段名），不适合给用户看。
 * 只有 code 不在枚举内时才退回服务端文案。
 */
export function messageForCode(code: ApiCode, serverMessage?: string): string {
  const preset = API_CODE_MESSAGE[code];
  if (preset) return preset;
  if (serverMessage && serverMessage.trim()) return serverMessage.trim();
  return API_CODE_MESSAGE[API_CODE.INTERNAL_ERROR];
}

function failure(code: ApiCode, message?: string): DiagnosisFailure {
  return { code, message: message ?? messageForCode(code) };
}

const KNOWN_EVENTS: readonly string[] = SSE_EVENT_NAMES;

/**
 * 解析单个 SSE 帧。容错点：`:` 开头的注释行（心跳）、多行 data、字段值前导空格、
 * 名单外事件名（直接忽略而不是抛错，便于服务端将来加事件不炸旧前端）。
 */
function parseFrame(frame: string): SseEvent | null {
  let name = '';
  const dataLines: string[] = [];

  for (const line of frame.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    const sep = line.indexOf(':');
    const field = sep === -1 ? line : line.slice(0, sep);
    let value = sep === -1 ? '' : line.slice(sep + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') name = value;
    else if (field === 'data') dataLines.push(value);
  }

  if (!name || dataLines.length === 0) return null;
  if (!KNOWN_EVENTS.includes(name)) return null;

  try {
    const data: unknown = JSON.parse(dataLines.join('\n'));
    if (!data || typeof data !== 'object') return null;
    return { event: name, data } as SseEvent;
  } catch {
    return null;
  }
}

/**
 * 把字节流切成事件。用 reader.read() 显式循环而不是 for-await（流的异步迭代
 * 在部分 WebKit 上不可用），跨 chunk 的半截帧留在 buffer 里等下一片。
 */
async function* readSse(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent, void, undefined> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const event = parseFrame(frame);
        if (event) yield event;
        boundary = buffer.indexOf('\n\n');
      }
    }
    // 服务端未以空行收尾时，兜底解析残留帧
    const tail = parseFrame(buffer);
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

/**
 * 发起诊断。返回值要么是事件流，要么是一次性失败，调用方无需再判断状态码。
 */
export async function openDiagnosisStream(
  request: DiagnosisRequest,
  signal?: AbortSignal,
): Promise<DiagnosisStream> {
  let res: Response;
  try {
    res = await fetch(DIAGNOSIS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(request),
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      return { ok: false, failure: failure(API_CODE.OK, '已取消') };
    }
    void err;
    return {
      ok: false,
      failure: failure(API_CODE.INTERNAL_ERROR, '网络连接中断了，请检查网络后重试。'),
    };
  }

  // 网关级真状态码
  if (res.status === 429) {
    return { ok: false, failure: failure(API_CODE.RATE_LIMITED) };
  }
  if (res.status === 413) {
    return { ok: false, failure: failure(API_CODE.FILE_TOO_LARGE_OR_UNSUPPORTED) };
  }

  const contentType = res.headers.get('content-type') ?? '';

  // 非流式响应 = 业务错误信封（含 200 + 非 0 code，以及未捕获的 5xx）
  if (!contentType.includes('text/event-stream')) {
    let envelope: ApiEnvelope<null> | null = null;
    try {
      envelope = (await res.json()) as ApiEnvelope<null>;
    } catch {
      envelope = null;
    }
    const raw: unknown = envelope?.code;
    const code = isApiCode(raw) ? raw : API_CODE.INTERNAL_ERROR;
    return {
      ok: false,
      failure: { code, message: messageForCode(code, envelope?.message) },
    };
  }

  if (!res.body) {
    return {
      ok: false,
      failure: failure(
        API_CODE.INTERNAL_ERROR,
        '当前浏览器不支持流式读取，请更新微信或换用系统浏览器打开。',
      ),
    };
  }

  return { ok: true, events: readSse(res.body) };
}
