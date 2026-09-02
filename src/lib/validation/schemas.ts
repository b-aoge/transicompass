/**
 * 请求入参 Zod schema。唯一来源：openapi.yaml。
 * 这是前后端共用的校验入口：前端做即时表单反馈，服务端做权威校验。
 *
 * 结构性闸门（Spec 9.2，从 ./payload 再导出）：
 *   - track_matches 恰好 3 条且 track_code 互不相同
 *   - 每条匹配的 reasons 至少 2 条，杜绝裸奔的百分比
 *   - track_code 只能取三值枚举，模型不得创造第四个赛道
 */

import { z } from 'zod';

import {
  AUTH_SCENES,
  CONTACT_TYPES,
  DELETE_SCOPES,
  TELEMETRY_EVENT_NAMES,
} from '@/lib/types/api';
import { CTA_TYPES, DEVICE_TYPES, INPUT_TYPES } from '@/lib/types/domain';

export * from './payload';

export const PHONE_PATTERN = /^1[3-9]\d{9}$/;
export const AUTH_CODE_PATTERN = /^\d{6}$/;
export const SHARE_TOKEN_LENGTH = 32;

export const UuidSchema = z.string().uuid();

export const SanitizeReportSchema = z
  .object({
    name: z.number().int().min(0),
    phone: z.number().int().min(0),
    email: z.number().int().min(0),
    idcard: z.number().int().min(0),
    company: z.number().int().min(0),
    project: z.number().int().min(0),
    url: z.number().int().min(0),
    injection_hits: z.number().int().min(0).optional(),
  })
  .strict();

export const PrivacyConsentSchema = z.object({
  // 未勾选时校验失败（route 映射为 1002），不发生任何数据处理
  accepted: z.literal(true),
  policy_version: z.string().min(1).max(32),
  accepted_at: z.string().datetime({ offset: true }),
});

export const DiagnosisFormSchema = z.object({
  years_of_experience: z.number().int().min(0).max(45),
  main_work: z.string().min(20).max(2000),
  target_direction: z.string().max(100),
});

export const DiagnosisRequestSchema = z
  .object({
    input_type: z.enum(INPUT_TYPES),
    sanitized_text: z.string().min(80).max(20000),
    sanitize_report: SanitizeReportSchema,
    form: DiagnosisFormSchema.optional(),
    privacy_consent: PrivacyConsentSchema,
    client_meta: z
      .object({
        device: z.enum(DEVICE_TYPES).optional(),
        app_version: z.string().max(16).optional(),
      })
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.input_type === 'form' && !v.form) {
      ctx.addIssue({
        code: 'custom',
        path: ['form'],
        message: 'input_type 为 form 时必须提供 form 字段',
      });
    }
  });

export const SaveResultRequestSchema = z.object({
  result_id: UuidSchema,
  title: z.string().min(1).max(40).optional(),
});

export const GetResultQuerySchema = z.object({
  share_token: z.string().length(SHARE_TOKEN_LENGTH).optional(),
});

export const ExportRequestSchema = z.object({
  result_id: UuidSchema,
  format: z.literal('pdf'),
});

export const CreateShareRequestSchema = z.object({
  result_id: UuidSchema,
});

export const DeleteDataRequestSchema = z.object({
  scope: z.enum(DELETE_SCOPES).default('session'),
  confirm: z.literal(true),
});

export const LeadRequestSchema = z.object({
  cta_type: z.enum(CTA_TYPES),
  contact: z.string().min(5).max(40),
  contact_type: z.enum(CONTACT_TYPES),
  result_id: UuidSchema.nullish(),
  source_channel: z.string().max(20).nullish(),
  consent: z.object({
    accepted: z.boolean(),
    policy_version: z.string().min(1).max(32),
  }),
});

export const SendAuthCodeRequestSchema = z.object({
  phone: z.string().regex(PHONE_PATTERN),
  scene: z.enum(AUTH_SCENES),
});

export const VerifyAuthCodeRequestSchema = z.object({
  phone: z.string().regex(PHONE_PATTERN),
  code: z.string().regex(AUTH_CODE_PATTERN),
});

export const TelemetryEventSchema = z.object({
  name: z.enum(TELEMETRY_EVENT_NAMES),
  props: z.record(z.string(), z.unknown()).optional(),
  occurred_at: z.string().datetime({ offset: true }),
});

/**
 * 埋点入参刻意宽松：name 不在白名单的条目由 /events 端点静默丢弃而非整批拒绝，
 * 所以这里先收成 unknown 数组，交由 telemetry 层逐条过滤。
 */
export const ReportEventsRequestSchema = z.object({
  events: z.array(z.unknown()).min(1).max(20),
  device: z.enum(DEVICE_TYPES).optional(),
  app_version: z.string().max(16).optional(),
});

export const FallbackSubscribeRequestSchema = z.object({
  session_id: UuidSchema,
  email: z.string().email().max(120),
});

export type DiagnosisRequestParsed = z.infer<typeof DiagnosisRequestSchema>;
export type LeadRequestParsed = z.infer<typeof LeadRequestSchema>;
export type DeleteDataRequestParsed = z.infer<typeof DeleteDataRequestSchema>;
export type TelemetryEventParsed = z.infer<typeof TelemetryEventSchema>;
