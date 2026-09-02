/**
 * API 请求与响应类型。唯一来源：openapi.yaml paths。
 * 这是前后端共用的类型入口，前端只需 import 本文件。
 *
 * 零运行时依赖：本文件及其 re-export 的两个文件都不 import 任何三方库。
 */

import type { ApiCode } from './codes';
import type {
  CtaType,
  DeviceType,
  Gap,
  InputType,
  PathStage,
  PrivacyConsent,
  ResultStatus,
  ResultView,
  RewriteSample,
  SanitizeReport,
  TrackMatch,
  TransferableSkill,
} from './domain';

export * from './codes';
export * from './domain';

/** 统一响应信封。code 非 0 时 data 恒为 null。 */
export interface ApiEnvelope<T> {
  code: ApiCode;
  data: T | null;
  message: string;
}

/** 埋点事件白名单（Spec 11.3）。名单外的事件服务端静默丢弃。 */
export const TELEMETRY_EVENT_NAMES = [
  'page_view',
  'diagnosis_started',
  'diagnosis_completed',
  'input_abandoned',
  'result_exported',
  'result_shared',
  'cta_clicked',
  'lead_submitted',
  'ai_call_failed',
  'error_occurred',
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];

// ---------------------------------------------------------------------------
// POST /diagnosis
// ---------------------------------------------------------------------------

export interface DiagnosisFormInput {
  years_of_experience: number;
  main_work: string;
  target_direction: string;
}

export interface DiagnosisClientMeta {
  device?: DeviceType;
  app_version?: string;
}

export interface DiagnosisRequest {
  input_type: InputType;
  sanitized_text: string;
  sanitize_report: SanitizeReport;
  form?: DiagnosisFormInput;
  privacy_consent: PrivacyConsent;
  client_meta?: DiagnosisClientMeta;
}

export const SSE_EVENT_NAMES = [
  'accepted',
  'progress',
  'skills',
  'matches',
  'path',
  'done',
  'failed',
] as const;

export type SseEventName = (typeof SSE_EVENT_NAMES)[number];

export const PROGRESS_STAGES = ['extracting', 'matching', 'persisting'] as const;
export type ProgressStage = (typeof PROGRESS_STAGES)[number];

export interface SseAcceptedData {
  result_id: string;
  session_id: string;
}

export interface SseProgressData {
  stage: ProgressStage;
  percent: number;
}

export interface SseSkillsData {
  transferable_skills: TransferableSkill[];
}

export interface SseMatchesData {
  track_matches: TrackMatch[];
  top_gaps: Gap[];
}

export interface SsePathData {
  learning_path: PathStage[];
  rewrite_samples: RewriteSample[];
}

export interface SseDoneData {
  result_id: string;
  status: ResultStatus;
  out_of_scope: boolean;
}

export interface SseFailedData {
  code: ApiCode;
  message: string;
  session_id?: string;
}

/** 判别联合，前端 switch(event.event) 即可窄化 data 类型。 */
export type SseEvent =
  | { event: 'accepted'; data: SseAcceptedData }
  | { event: 'progress'; data: SseProgressData }
  | { event: 'skills'; data: SseSkillsData }
  | { event: 'matches'; data: SseMatchesData }
  | { event: 'path'; data: SsePathData }
  | { event: 'done'; data: SseDoneData }
  | { event: 'failed'; data: SseFailedData };

// ---------------------------------------------------------------------------
// POST /results  |  GET /results/{id}
// ---------------------------------------------------------------------------

export interface SaveResultRequest {
  result_id: string;
  title?: string;
}

export interface SaveResultData {
  result_id: string;
  saved_at: string;
  expires_at: string;
}

export type SaveResultResponse = ApiEnvelope<SaveResultData>;
export type GetResultResponse = ApiEnvelope<ResultView>;

// ---------------------------------------------------------------------------
// POST /export  |  POST /share
// ---------------------------------------------------------------------------

export interface ExportRequest {
  result_id: string;
  format: 'pdf';
}

export interface CreateShareRequest {
  result_id: string;
}

export interface CreateShareData {
  share_token: string;
  share_url: string;
  expires_at: string;
}

export type CreateShareResponse = ApiEnvelope<CreateShareData>;

// ---------------------------------------------------------------------------
// DELETE /data
// ---------------------------------------------------------------------------

export const DELETE_SCOPES = ['session', 'all'] as const;
export type DeleteScope = (typeof DELETE_SCOPES)[number];

export interface DeleteDataRequest {
  scope?: DeleteScope;
  confirm: true;
}

export interface DeleteDataData {
  scope: DeleteScope;
  deleted_at: string;
  deleted: {
    sessions: number;
    results: number;
    shares: number;
    events: number;
  };
  retained: {
    leads: number;
    reason: string;
  };
}

export type DeleteDataResponse = ApiEnvelope<DeleteDataData>;

// ---------------------------------------------------------------------------
// POST /lead
// ---------------------------------------------------------------------------

export const CONTACT_TYPES = ['phone', 'wechat'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export interface LeadRequest {
  cta_type: CtaType;
  contact: string;
  contact_type: ContactType;
  result_id?: string | null;
  source_channel?: string | null;
  consent: { accepted: true; policy_version: string };
}

export interface LeadNextAction {
  type: 'qrcode' | 'queue';
  value: string;
  hint: string;
  queue_position?: number | null;
  eta_hours?: number | null;
}

export interface LeadData {
  lead_id: string;
  cta_type: CtaType;
  next_action: LeadNextAction;
}

export type LeadResponse = ApiEnvelope<LeadData>;

// ---------------------------------------------------------------------------
// POST /auth/code  |  POST /auth/verify
// ---------------------------------------------------------------------------

export const AUTH_SCENES = ['save', 'export', 'share'] as const;
export type AuthScene = (typeof AUTH_SCENES)[number];

export interface SendAuthCodeRequest {
  phone: string;
  scene: AuthScene;
}

export interface SendAuthCodeData {
  sent: boolean;
  resend_after: number;
}

export interface VerifyAuthCodeRequest {
  phone: string;
  code: string;
}

export interface VerifyAuthCodeData {
  user_id: string;
  is_new: boolean;
}

export type SendAuthCodeResponse = ApiEnvelope<SendAuthCodeData>;
export type VerifyAuthCodeResponse = ApiEnvelope<VerifyAuthCodeData>;

// ---------------------------------------------------------------------------
// POST /events  |  POST /fallback-subscribe
// ---------------------------------------------------------------------------

export interface TelemetryEvent {
  name: TelemetryEventName;
  props?: Record<string, unknown>;
  occurred_at: string;
}

export interface ReportEventsRequest {
  events: TelemetryEvent[];
  device?: DeviceType;
  app_version?: string;
}

export type ReportEventsResponse = ApiEnvelope<null>;

export interface FallbackSubscribeRequest {
  session_id: string;
  email: string;
}

export interface FallbackSubscribeData {
  subscribed: boolean;
  eta_minutes: number;
}

export type FallbackSubscribeResponse = ApiEnvelope<FallbackSubscribeData>;

// ---------------------------------------------------------------------------
// GET /api/health（基础设施端点，不带 /v1 前缀）
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: 'ok' | 'degraded';
  db: 'ok' | 'down';
  redis: 'ok' | 'down' | 'disabled';
  llm: 'ok' | 'down' | 'mock';
  version: string;
  uptime_s: number;
}
