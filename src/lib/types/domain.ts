/**
 * 诊断领域模型类型。唯一来源：openapi.yaml components.schemas。
 * 与 src/lib/validation/schemas.ts 中的 Zod schema 一一对应，改一处必须同步改另一处。
 *
 * 本文件零运行时依赖（仅 as const 常量数组），前端可直接 import。
 */

/** V1 锁定 3 个赛道，模型不得生成枚举外的值（Spec 2.3）。 */
export const TRACK_CODES = [
  'NEW_ENERGY_STORAGE',
  'SMART_CONSTRUCTION_BIM',
  'ENGINEERING_B2B_OVERSEAS',
] as const;

export type TrackCode = (typeof TRACK_CODES)[number];

export const CTA_TYPES = ['community', 'consult_1v1'] as const;
export type CtaType = (typeof CTA_TYPES)[number];

export const DEVICE_TYPES = ['mobile', 'desktop', 'wechat'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const INPUT_TYPES = ['resume', 'form'] as const;
export type InputType = (typeof INPUT_TYPES)[number];

export const STRENGTH_LEVELS = ['high', 'medium', 'low'] as const;
export type StrengthLevel = (typeof STRENGTH_LEVELS)[number];

export const MATCH_LEVELS = ['high', 'medium', 'low'] as const;
export type MatchLevel = (typeof MATCH_LEVELS)[number];

/** 顺序固定，learning_path 必须按此顺序输出三条。 */
export const PATH_STAGES = ['0-1m', '1-3m', '3-6m'] as const;
export type PathStageCode = (typeof PATH_STAGES)[number];

export const RESULT_STATUSES = ['completed', 'degraded'] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

export const VIEW_MODES = ['owner', 'shared'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/** 占位符替换计数，仅计数不含原文片段（Spec 6.2.1）。 */
export interface SanitizeReport {
  name: number;
  phone: number;
  email: number;
  idcard: number;
  company: number;
  project: number;
  url: number;
  injection_hits?: number;
}

export interface PrivacyConsent {
  accepted: boolean;
  policy_version: string;
  accepted_at: string;
}

/** 可解释性的最小单元。source_snippet 必须逐字出自 sanitized_text。 */
export interface Evidence {
  source_snippet: string;
  why: string;
}

/** 赛道匹配的结构化依据三元组，PIPL 第 24 条说明权的落地点。 */
export interface Reason {
  source_quote: string;
  mapped_capability: string;
  target_scenario: string;
}

export interface TransferableSkill {
  name: string;
  description: string;
  strength: StrengthLevel;
  source_quote: string;
  evidence: Evidence[];
}

/** reasons 最少 2 条是硬约束，结构上不允许出现裸奔的百分比。 */
export interface TrackMatch {
  track_code: TrackCode;
  match_score: number;
  match_level: MatchLevel;
  reasons: Reason[];
  typical_roles: string[];
  caveat: string;
}

export interface Gap {
  gap_name: string;
  why_it_matters: string;
  closing_action: string;
}

export interface PathStage {
  stage: PathStageCode;
  deliverable: string;
  why_this_deliverable: string;
  verifiable_artifact: string;
}

export interface RewriteSample {
  target_track_code: TrackCode;
  original: string;
  rewritten: string;
  what_changed: string;
}

export interface DiagnosisPayload {
  out_of_scope: boolean;
  out_of_scope_reason: string | null;
  summary: string;
  transferable_skills: TransferableSkill[];
  track_matches: TrackMatch[];
  top_gaps: Gap[];
  learning_path: PathStage[];
  rewrite_samples: RewriteSample[];
}

/** 合规公示，结果页必须渲染（生成式人工智能服务登记要求）。 */
export interface ModelDisclosure {
  model_name: string;
  registration_no: string;
}

export interface ResultView {
  result_id: string;
  created_at: string;
  status: ResultStatus;
  out_of_scope: boolean;
  view_mode: ViewMode;
  payload: DiagnosisPayload;
  model_disclosure: ModelDisclosure;
  disclaimer: string;
}
