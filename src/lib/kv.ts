/**
 * 键值存储抽象。Redis 只做两件事：验证码短时存储、限流滑动窗口（ADR-007）。
 * 明确不做缓存层——MVP 没有缓存需求，加了只增加一致性 bug 面。
 *
 * REDIS_URL 为空或连接失败时自动降级为进程内 Map（单实例可用，Spec 11.4）。
 * 降级是刻意保留的部署弹性，不是临时兜底。
 */

import type Redis from 'ioredis';

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memory = new Map<string, MemoryEntry>();

let redisClient: Redis | null = null;
let redisReady = false;
let initialized = false;

function pruneMemory(now: number): void {
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
}

async function ensureClient(): Promise<Redis | null> {
  if (initialized) return redisReady ? redisClient : null;
  initialized = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const { default: RedisCtor } = await import('ioredis');
    const client = new RedisCtor(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    client.on('error', () => {
      redisReady = false;
    });
    await client.connect();
    redisClient = client;
    redisReady = true;
    return client;
  } catch {
    redisReady = false;
    return null;
  }
}

export async function kvGet(key: string): Promise<string | null> {
  const client = await ensureClient();
  if (client && redisReady) {
    try {
      return await client.get(key);
    } catch {
      redisReady = false;
    }
  }
  const now = Date.now();
  pruneMemory(now);
  const entry = memory.get(key);
  return entry && entry.expiresAt > now ? entry.value : null;
}

export async function kvSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const client = await ensureClient();
  if (client && redisReady) {
    try {
      await client.set(key, value, 'EX', ttlSeconds);
      return;
    } catch {
      redisReady = false;
    }
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function kvDelete(key: string): Promise<void> {
  const client = await ensureClient();
  if (client && redisReady) {
    try {
      await client.del(key);
      return;
    } catch {
      redisReady = false;
    }
  }
  memory.delete(key);
}

/** 原子自增并在首次写入时设置 TTL，返回自增后的计数与剩余秒数。 */
export async function kvIncrWithTtl(
  key: string,
  ttlSeconds: number,
): Promise<{ count: number; ttl: number }> {
  const client = await ensureClient();
  if (client && redisReady) {
    try {
      const count = await client.incr(key);
      if (count === 1) await client.expire(key, ttlSeconds);
      const ttl = await client.ttl(key);
      return { count, ttl: ttl > 0 ? ttl : ttlSeconds };
    } catch {
      redisReady = false;
    }
  }

  const now = Date.now();
  pruneMemory(now);
  const entry = memory.get(key);
  if (!entry || entry.expiresAt <= now) {
    memory.set(key, { value: '1', expiresAt: now + ttlSeconds * 1000 });
    return { count: 1, ttl: ttlSeconds };
  }
  const count = Number(entry.value) + 1;
  entry.value = String(count);
  return { count, ttl: Math.ceil((entry.expiresAt - now) / 1000) };
}

export function kvBackend(): 'redis' | 'memory' {
  return redisReady ? 'redis' : 'memory';
}

/** 单测用：清空进程内状态。 */
export function resetKvForTest(): void {
  memory.clear();
  redisClient = null;
  redisReady = false;
  initialized = false;
}
