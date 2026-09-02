/**
 * 应用层限流（Spec 10.3 / 7.2 / 7.8 / 7.9）。
 *
 * 维度取 sid、手机号哈希、user_id，不取 IP——IP 层限流由 Nginx limit_req 承担，
 * 且 IP 仅在内存计数不落盘（ADR-010 明确不采集 IP）。
 *
 * 触发限流是少数返回真实 HTTP 429 的场景之一（Spec 7.1）。
 */

import { kvIncrWithTtl } from '@/lib/kv';

const HOUR = 3600;
const DAY = 86400;

export interface RateRule {
  /** Redis key 前缀，同时是可读的规则名 */
  name: string;
  limit: number;
  windowSeconds: number;
}

function intFromEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const RATE_RULES = {
  diagnosisPerSid: (): RateRule => ({
    name: 'diagnosis:sid',
    limit: intFromEnv('RATE_DIAGNOSIS_PER_SID_HOUR', 5),
    windowSeconds: HOUR,
  }),
  diagnosisPerIp: (): RateRule => ({
    name: 'diagnosis:ip',
    limit: intFromEnv('RATE_DIAGNOSIS_PER_IP_HOUR', 20),
    windowSeconds: HOUR,
  }),
  leadPerSid: (): RateRule => ({
    name: 'lead:sid',
    limit: intFromEnv('RATE_LEAD_PER_SID_HOUR', 3),
    windowSeconds: HOUR,
  }),
  exportPerUser: (): RateRule => ({
    name: 'export:user',
    limit: intFromEnv('RATE_EXPORT_PER_USER_HOUR', 10),
    windowSeconds: HOUR,
  }),
  authCodePerPhoneMinute: (): RateRule => ({
    name: 'authcode:phone:min',
    limit: 1,
    windowSeconds: 60,
  }),
  authCodePerPhoneDay: (): RateRule => ({
    name: 'authcode:phone:day',
    limit: 5,
    windowSeconds: DAY,
  }),
  authCodePerSidDay: (): RateRule => ({
    name: 'authcode:sid:day',
    limit: 10,
    windowSeconds: DAY,
  }),
} as const;

export interface RateVerdict {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function consumeRate(rule: RateRule, subject: string): Promise<RateVerdict> {
  const key = `rate:${rule.name}:${subject}`;
  const { count, ttl } = await kvIncrWithTtl(key, rule.windowSeconds);
  const allowed = count <= rule.limit;
  return {
    allowed,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: allowed ? 0 : Math.max(1, ttl),
  };
}

/**
 * 按顺序消费多条规则，任一条不通过即整体拒绝。
 * 注意：先命中的规则已经计数，这是刻意的——被限流的请求也应计入后续窗口，
 * 否则攻击者可以靠触发第一条规则来规避第二条的计数。
 */
export async function consumeAll(
  entries: readonly { rule: RateRule; subject: string }[],
): Promise<RateVerdict> {
  let worst: RateVerdict = { allowed: true, remaining: Number.MAX_SAFE_INTEGER, retryAfterSeconds: 0 };
  for (const entry of entries) {
    const verdict = await consumeRate(entry.rule, entry.subject);
    if (!verdict.allowed && (worst.allowed || verdict.retryAfterSeconds > worst.retryAfterSeconds)) {
      worst = verdict;
    } else if (worst.allowed && verdict.remaining < worst.remaining) {
      worst = { ...worst, remaining: verdict.remaining };
    }
  }
  return worst;
}
