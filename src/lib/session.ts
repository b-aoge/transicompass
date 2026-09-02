import { cookies } from 'next/headers';
import { SESSION_DAYS } from './env';

/**
 * 匿名会话（openapi securitySchemes.sessionCookie）。
 * 不含实名信息；httpOnly + Secure + SameSite=Lax + 30d。
 */

export const SID_COOKIE = 'sid';

export function sessionCookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  };
}

/** 从请求读取 sid；不存在返回 null（由调用方决定是否新建并下发） */
export async function readSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SID_COOKIE)?.value ?? null;
}
