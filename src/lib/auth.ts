/**
 * 演示版登录态（Spec /auth/*）。
 * 用 jose 签发 HMAC-JWT，用户标识写入 httpOnly cookie（tcsid）。
 * 生产接入短信网关后，此处仅替换校验逻辑，签发/校验不变。
 */

import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { JWT_SECRET } from './env';

export const AUTH_COOKIE = 'tcsid';
const ALG = 'HS256';
const MAX_AGE_SECONDS = 30 * 86400;

function secretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/** 演示开关：CloudBase 环境设 AUTH_DEMO=true 才开启注册；否则保持禁用，避免误开。 */
export const AUTH_DEMO = process.env.AUTH_DEMO === 'true';

export async function signUserId(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey());
}

export async function verifyUserId(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: [ALG] });
    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    return null;
  }
}

export function authCookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}

/** 从请求读取当前登录用户 id（无登录态返回 null）。 */
export async function readUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyUserId(token);
}
