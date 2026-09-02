/**
 * 落地页表单值 → openapi `DiagnosisRequest` 的映射层。
 *
 * 契约唯一来源是 `@/lib/types/api` 与 `@/lib/validation/schemas`（后端所有权，本层只读不改）。
 * 本文件只负责「前端交互模型」到「传输模型」的翻译，不做任何业务判断。
 */

import type {
  DeviceType,
  DiagnosisRequest,
  SanitizeReport,
} from '@/lib/types/api';
import type { DirectionValue, ExperienceValue } from '@/features/landing/constants';

/** 与 /legal/privacy 正文同版本。改隐私政策必须同步改这里，否则同意记录会指向错误版本。 */
export const PRIVACY_POLICY_VERSION = 'v1.0';

/** 与 package.json version 同步；schema 限制 max(16)。 */
export const APP_VERSION = '1.0.0';

/** openapi: sanitized_text minLength 80 / maxLength 20000。 */
export const SANITIZED_TEXT_MIN = 80;
export const SANITIZED_TEXT_MAX = 20000;
/** openapi: form.main_work minLength 20 / maxLength 2000。 */
export const MAIN_WORK_MIN = 20;
export const MAIN_WORK_MAX = 2000;

/**
 * 分桶 → 整数年限。openapi 的 `years_of_experience` 是 integer(0..45)，
 * 而落地页为降低填写成本用的是区间单选，这里取区间代表值，**这层转换是有损的**。
 */
const YEARS_BY_BUCKET: Record<ExperienceValue, number> = {
  lt_2: 1,
  '2_5': 3,
  '5_8': 6,
  '8_12': 10,
  gt_12: 15,
};

/** 拼装 sanitized_text 时用的人读年限文案。 */
const EXPERIENCE_TEXT: Record<ExperienceValue, string> = {
  lt_2: '2 年以内',
  '2_5': '2 到 5 年',
  '5_8': '5 到 8 年',
  '8_12': '8 到 12 年',
  gt_12: '12 年以上',
};

/** openapi target_direction 描述明确要求：不确定时传「不知道」。 */
const DIRECTION_TEXT: Record<DirectionValue, string> = {
  NEW_ENERGY_STORAGE: '新能源与储能',
  SMART_CONSTRUCTION_BIM: '智能建造与 BIM',
  ENGINEERING_B2B_OVERSEAS: '工程类 B2B 出海',
  UNKNOWN: '不知道',
};

export interface LandingFormValues {
  experience: ExperienceValue;
  /** 已在浏览器内完成 PII 脱敏的工作描述 */
  sanitizedWork: string;
  direction: DirectionValue;
}

/**
 * 表单三字段拼成一段连续叙述。
 *
 * 为什么要拼：openapi 对 sanitized_text 无条件要求 ≥80 字，而 main_work 下限只有 20，
 * 表单路径若只上送 main_work 必然被长度闸门挡下（且当前实现回的是 1001 而非 1003）。
 * 拼装同时也让模型拿到年限与目标方向的上下文，而不是三个孤立字段。
 */
export function composeSanitizedText(values: LandingFormValues): string {
  const text = [
    `从业年限：${EXPERIENCE_TEXT[values.experience]}。`,
    `主要工作内容：${values.sanitizedWork.trim()}`,
    `目标方向：${DIRECTION_TEXT[values.direction]}。`,
  ].join('\n');
  return text.slice(0, SANITIZED_TEXT_MAX);
}

/** 模板固定开销（不含 main_work 本身），用于把「还差多少字」换算回输入框。 */
export function templateOverhead(values: Pick<LandingFormValues, 'experience' | 'direction'>): number {
  return composeSanitizedText({ ...values, sanitizedWork: '' }).length;
}

/** 运行环境识别。仅可在浏览器侧调用。 */
export function detectDevice(): DeviceType {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/MicroMessenger/i.test(ua)) return 'wechat';
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * 组装最终请求体。
 * 注意 privacy_consent.accepted 原样透传（不强制 true）——
 * 未勾选与「勾选了 false」在服务端要能区分，前端不替用户改这个值。
 */
export function buildDiagnosisRequest(params: {
  values: LandingFormValues;
  report: SanitizeReport;
  accepted: boolean;
}): DiagnosisRequest {
  const { values, report, accepted } = params;
  return {
    input_type: 'form',
    sanitized_text: composeSanitizedText(values),
    sanitize_report: report,
    form: {
      years_of_experience: YEARS_BY_BUCKET[values.experience],
      main_work: values.sanitizedWork.trim().slice(0, MAIN_WORK_MAX),
      target_direction: DIRECTION_TEXT[values.direction],
    },
    privacy_consent: {
      accepted,
      policy_version: PRIVACY_POLICY_VERSION,
      accepted_at: new Date().toISOString(),
    },
    client_meta: {
      device: detectDevice(),
      app_version: APP_VERSION,
    },
  };
}

/**
 * 惰性加载浏览器端脱敏器。
 *
 * 为什么不静态 import：`@/lib/client/sanitize` 当前使用了 RegExp 后行断言，
 * 在 iOS < 16.4（含 P0 目标 iOS 14 微信内置浏览器）会在**解析期**抛 SyntaxError。
 * 静态引入会连带整个落地页 chunk 白屏；动态引入可把它降级为一次可捕获的失败。
 * 这是权宜措施，正式修复在 lib 侧（已同步给后端）。
 */
export async function loadSanitizer(): Promise<
  ((text: string) => { text: string; report: SanitizeReport }) | null
> {
  try {
    const mod = await import('@/lib/client/sanitize');
    return typeof mod.sanitizePII === 'function' ? mod.sanitizePII : null;
  } catch {
    return null;
  }
}
