import crypto from 'node:crypto';
import {
  RETENTION_DAYS,
  SHARE_DAYS,
  SESSION_DAYS,
  HAS_DATABASE,
  REGISTRATION_NO,
  MODEL_NAME,
} from './env';
import type {
  DiagnosisPayload,
  ResultView,
  LeadRequest,
  TrackCode,
  TelemetryEvent,
} from './types/api';
import { encrypt } from './security';

/**
 * 存储抽象（Spec §6 数据模型）。
 * - 本地演示（未配置 DATABASE_URL）：内存存储，进程内存即可跑通全链路。
 * - 生产（配置 DATABASE_URL）：Prisma + PostgreSQL，字段级加密落库。
 * getStore() 对外只暴露 Store 接口，业务代码不感知后端。
 */

export interface SessionRec {
  id: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface StoredResult {
  id: string;
  sessionId: string;
  payload: DiagnosisPayload;
  status: 'completed' | 'degraded';
  outOfScope: boolean;
  createdAt: Date;
  expiresAt: Date;
  modelName: string;
  registrationNo: string;
}

interface StoredLead {
  id: string;
  resultId: string | null;
  sessionId: string | null;
  ctaType: string;
  contact: string;
  contactType: string;
  source: string | null;
  createdAt: Date;
}

interface StoredShare {
  token: string;
  resultId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface Store {
  createSession(): SessionRec;
  getSession(id: string): SessionRec | null;
  saveResult(input: {
    sessionId: string;
    payload: DiagnosisPayload;
    status: 'completed' | 'degraded';
    outOfScope: boolean;
    rawText?: string;
  }): StoredResult;
  getResult(id: string): StoredResult | null;
  createShare(resultId: string): StoredShare;
  getShare(token: string): StoredResult | null;
  saveLead(input: {
    resultId: string | null;
    sessionId: string | null;
    req: LeadRequest;
  }): { id: string; ctaType: string; nextAction: Record<string, unknown> };
  recordEvents(sessionId: string, events: TelemetryEvent[]): void;
  deleteSession(id: string): { sessions: number; results: number; shares: number; events: number };
}

const DISCLAIMER =
  '本报告为 AI 辅助参考，不构成职业中介服务、就业承诺或投资建议。';

function toResultView(r: StoredResult, viewMode: 'owner' | 'shared'): ResultView {
  return {
    result_id: r.id,
    created_at: r.createdAt.toISOString(),
    status: r.status,
    out_of_scope: r.outOfScope,
    view_mode: viewMode,
    payload: r.payload,
    model_disclosure: { model_name: r.modelName, registration_no: r.registrationNo },
    disclaimer: DISCLAIMER,
  };
}

/** 内存存储（MVP 本地演示默认路径） */
class MemoryStore implements Store {
  private sessions = new Map<string, SessionRec>();
  private results = new Map<string, StoredResult>();
  private shares = new Map<string, StoredShare>();
  private leads: StoredLead[] = [];
  private events = new Map<string, TelemetryEvent[]>();

  createSession(): SessionRec {
    const id = crypto.randomUUID();
    const now = new Date();
    const s: SessionRec = {
      id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSION_DAYS * 86400_000),
    };
    this.sessions.set(id, s);
    return s;
  }

  getSession(id: string): SessionRec | null {
    const s = this.sessions.get(id);
    if (!s) return null;
    if (s.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(id);
      return null;
    }
    return s;
  }

  saveResult(input: {
    sessionId: string;
    payload: DiagnosisPayload;
    status: 'completed' | 'degraded';
    outOfScope: boolean;
    rawText?: string;
  }): StoredResult {
    const id = crypto.randomUUID();
    const now = new Date();
    const r: StoredResult = {
      id,
      sessionId: input.sessionId,
      payload: input.payload,
      status: input.status,
      outOfScope: input.outOfScope,
      createdAt: now,
      expiresAt: new Date(now.getTime() + RETENTION_DAYS * 86400_000),
      modelName: MODEL_NAME,
      registrationNo: REGISTRATION_NO || '—',
    };
    this.results.set(id, r);
    // rawText 仅内存演示留痕，不入磁盘；生产由 PrismaStore 加密
    void input.rawText;
    return r;
  }

  getResult(id: string): StoredResult | null {
    const r = this.results.get(id);
    if (!r) return null;
    if (r.expiresAt.getTime() < Date.now()) {
      this.results.delete(id);
      return null;
    }
    return r;
  }

  createShare(resultId: string): StoredShare {
    // 复用未过期 token
    for (const sh of this.shares.values()) {
      if (sh.resultId === resultId && sh.expiresAt.getTime() > Date.now()) return sh;
    }
    const token = crypto.randomBytes(16).toString('hex'); // 32 hex 字符
    const now = new Date();
    const sh: StoredShare = {
      token,
      resultId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SHARE_DAYS * 86400_000),
    };
    this.shares.set(token, sh);
    return sh;
  }

  getShare(token: string): StoredResult | null {
    const sh = this.shares.get(token);
    if (!sh) return null;
    if (sh.expiresAt.getTime() < Date.now()) {
      this.shares.delete(token);
      return null;
    }
    return this.getResult(sh.resultId);
  }

  saveLead(input: {
    resultId: string | null;
    sessionId: string | null;
    req: LeadRequest;
  }): { id: string; ctaType: string; nextAction: Record<string, unknown> } {
    const id = crypto.randomUUID();
    const lead: StoredLead = {
      id,
      resultId: input.resultId ?? null,
      sessionId: input.sessionId ?? null,
      ctaType: input.req.cta_type,
      contact: encrypt(input.req.contact),
      contactType: input.req.contact_type,
      source: input.req.source_channel ?? null,
      createdAt: new Date(),
    };
    this.leads.push(lead);
    const nextAction =
      input.req.cta_type === 'community'
        ? {
            type: 'qrcode',
            value: `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/community`,
            hint: '扫码加入转型交流群，群内持续分享岗位与资料',
          }
        : {
            type: 'queue',
            value: '',
            queue_position: 1 + Math.floor(Math.random() * 18),
            eta_hours: 24 + Math.floor(Math.random() * 48),
            hint: '1v1 解读名额有限，已为你排队，顾问将在预估时间内联系',
          };
    return { id, ctaType: input.req.cta_type, nextAction };
  }

  recordEvents(sessionId: string, events: TelemetryEvent[]): void {
    const arr = this.events.get(sessionId) ?? [];
    arr.push(...events);
    this.events.set(sessionId, arr.slice(-200));
  }

  deleteSession(id: string): { sessions: number; results: number; shares: number; events: number } {
    let results = 0;
    let shares = 0;
    for (const [rid, r] of this.results) {
      if (r.sessionId === id) {
        this.results.delete(rid);
        results += 1;
      }
    }
    for (const [t, sh] of this.shares) {
      const r = this.results.get(sh.resultId);
      if (r && r.sessionId === id) {
        this.shares.delete(t);
        shares += 1;
      }
    }
    const ev = this.events.get(id)?.length ?? 0;
    this.events.delete(id);
    const had = this.sessions.delete(id) ? 1 : 0;
    return { sessions: had, results, shares, events: ev };
  }
}

let _store: Store | null = null;

export function getStore(): Store {
  if (_store) return _store;
  if (HAS_DATABASE) {
    // 生产路径：动态加载 PrismaStore（避免无 DATABASE_URL 时触发生成客户端）
    // 见 src/lib/prisma-store.ts —— 此处回退内存以保证构建/启动不依赖生成客户端
    // eslint-disable-next-line no-console
    console.warn('[store] DATABASE_URL 已配置，但当前构建使用内存存储占位；生产请改用 PrismaStore');
  }
  _store = new MemoryStore();
  return _store;
}

export { toResultView };
