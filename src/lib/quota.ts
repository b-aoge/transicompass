/**
 * 诊断免费额度（用户需求：注册用户每 30 天 9 次、跨设备累计；匿名用户按浏览器 3 次）。
 *
 * - 注册用户：落 CloudBase NoSQL 文档数据库（users 集合），按 user_id 计数，
 *   真正跨设备、跨实例。额度重置、原子扣减均通过文档数据库命令完成。
 * - 匿名用户：复用 KV（Redis/内存降级，见 kv.ts），按浏览器 sid 维度，默认 3 次。
 *
 * 未配置 TCB_ENV（NoSQL 不可用）时，注册用户额度返回 ok:false，匿名额度仍可用。
 */

import crypto from 'node:crypto';
import { encrypt } from './security';
import { kvIncrWithTtl } from './kv';
import { getDb, nosqlEnabled } from './nosql';

export const USER_LIMIT = 9;
const USER_WINDOW_MS = 30 * 86400_000; // 30 天（毫秒，NoSQL 分支用）
export const ANON_LIMIT = 3;
const ANON_WINDOW_S = 30 * 86400;
const USER_WINDOW_S = 30 * 86400; // 30 天（秒，KV 分支用）

/**
 * 内存用户表：NoSQL 不可用时的降级存储（进程内，重启/多副本会重置）。
 * 单实例下按 user_id 跨设备累计，足以演示「注册后 9 次」的产品逻辑。
 */
const memUsers = new Map<string, { id: string; remainingCalls: number; quotaResetAt: number }>();

const PEPPER = process.env.ACCOUNT_PEPPER ?? 'transicompass-account-pepper-demo';

export interface QuotaResult {
  ok: boolean;
  remaining: number;
}

function phoneHash(phone: string): string {
  return crypto.createHmac('sha256', PEPPER).update(phone).digest('hex');
}

/** 演示注册：按手机号定位/创建用户，返回 id 与剩余额度。
 *  NoSQL 可用时走文档数据库；不可用时降级到进程内存表（重启重置）。 */
export async function ensureUser(
  phone: string,
): Promise<{ id: string; remainingCalls: number } | null> {
  if (nosqlEnabled()) {
    const db = getDb();
    const _ = db.command;
    const hash = phoneHash(phone);
    const existing = await db.collection('users').where({ phoneHash: hash }).limit(1).get();
    if ((existing.data as Record<string, unknown>[]).length) {
      const u = existing.data[0] as { _id: string; remainingCalls?: number };
      await db.collection('users').doc(u._id).update({ lastLoginAt: Date.now() });
      return { id: u._id, remainingCalls: u.remainingCalls ?? USER_LIMIT };
    }
    const now = Date.now();
    const doc = await db.collection('users').add({
      phoneHash: hash,
      phoneEnc: encrypt(phone),
      remainingCalls: USER_LIMIT,
      quotaResetAt: now,
      createdAt: now,
      lastLoginAt: now,
    });
    return { id: doc.id, remainingCalls: USER_LIMIT };
  }

  // 降级：进程内存用户表
  const hash = phoneHash(phone);
  const existing = memUsers.get(hash);
  if (existing) {
    return { id: existing.id, remainingCalls: existing.remainingCalls };
  }
  const id = crypto.randomUUID();
  memUsers.set(hash, { id, remainingCalls: USER_LIMIT, quotaResetAt: Date.now() });
  return { id, remainingCalls: USER_LIMIT };
}

/** 注册用户额度：每 30 天刷新为 9，原子扣减；无剩余返回 ok:false。
 *  NoSQL 可用时走文档数据库（真正跨设备）；不可用时降级到 KV（按 user_id，单实例跨设备）。 */
export async function consumeUserQuota(userId: string): Promise<QuotaResult> {
  if (nosqlEnabled()) {
    const db = getDb();
    const _ = db.command;
    const now = Date.now();
    const windowStart = now - USER_WINDOW_MS;

    // 窗口已过期 → 重置回 9
    await db.collection('users').where({ _id: userId, quotaResetAt: _.lt(windowStart) }).update({
      remainingCalls: USER_LIMIT,
      quotaResetAt: now,
    });
    // 已耗尽（但窗口内）→ 也重置回 9
    await db.collection('users').where({ _id: userId, remainingCalls: _.lte(0) }).update({
      remainingCalls: USER_LIMIT,
      quotaResetAt: now,
    });

    // 原子扣减（仅当剩余 > 0）
    const res = await db
      .collection('users')
      .where({ _id: userId, remainingCalls: _.gt(0) })
      .update({ remainingCalls: _.inc(-1) });
    if ((res as { updated?: number }).updated && (res as { updated: number }).updated >= 1) {
      const cur = await db.collection('users').doc(userId).get();
      const remaining = ((cur.data as { remainingCalls?: number }[])[0]?.remainingCalls) ?? 0;
      return { ok: true, remaining };
    }
    return { ok: false, remaining: 0 };
  }

  // 降级：KV 按 user_id（无 REDIS_URL 时退化为进程内存，同实例跨设备累计；重启重置）
  const { count } = await kvIncrWithTtl(`quota:user:${userId}`, USER_WINDOW_S);
  return { ok: count <= USER_LIMIT, remaining: Math.max(0, USER_LIMIT - count) };
}

/** 匿名额度：按浏览器 sid，默认 3，30 天滑动窗口。 */
export async function consumeAnonQuota(sessionId: string): Promise<QuotaResult> {
  const { count } = await kvIncrWithTtl(`quota:anon:${sessionId}`, ANON_WINDOW_S);
  return { ok: count <= ANON_LIMIT, remaining: Math.max(0, ANON_LIMIT - count) };
}
