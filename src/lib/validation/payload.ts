/**
 * AI 输出的 Zod 闸门。Spec 9.2 的实现，与 openapi.yaml 的 DiagnosisPayload 逐字段对齐。
 *
 * 设计意图：Schema 即产品约束。
 * reasons.min(2) 让可解释性成为数据结构层面的强制项——模型不给依据，
 * 结果就不合法，无法落库、无法渲染。这是把 PIPL 第 24 条编译进类型系统。
 */

import { z } from 'zod';

import {
  MATCH_LEVELS,
  PATH_STAGES,
  STRENGTH_LEVELS,
  TRACK_CODES,
} from '@/lib/types/domain';

export const EvidenceSchema = z.object({
  source_snippet: z.string().min(4).max(120),
  why: z.string().min(8).max(200),
});

export const ReasonSchema = z.object({
  source_quote: z.string().min(4).max(120),
  mapped_capability: z.string().min(4).max(60),
  target_scenario: z.string().min(8).max(120),
});

export const TransferableSkillSchema = z.object({
  name: z.string().min(2).max(24),
  description: z.string().min(10).max(160),
  strength: z.enum(STRENGTH_LEVELS),
  source_quote: z.string().min(4).max(120),
  evidence: z.array(EvidenceSchema).min(1).max(3),
});

export const TrackMatchSchema = z.object({
  track_code: z.enum(TRACK_CODES),
  match_score: z.number().int().min(0).max(100),
  match_level: z.enum(MATCH_LEVELS),
  // 硬约束：至少 2 条结构化依据，杜绝裸奔的百分比
  reasons: z.array(ReasonSchema).min(2).max(4),
  // 岗位推荐硬约束：每个赛道至少 3 个真实岗位（用户要求「每个岗位至少推荐 3 个」），上限 6 防止堆叠
  typical_roles: z.array(z.string().min(2).max(20)).min(3).max(6),
  caveat: z.string().min(10).max(200),
});

export const GapSchema = z.object({
  gap_name: z.string().min(2).max(24),
  why_it_matters: z.string().min(10).max(200),
  closing_action: z.string().min(10).max(200),
});

export const PathStageSchema = z.object({
  stage: z.enum(PATH_STAGES),
  deliverable: z.string().min(10).max(120),
  why_this_deliverable: z.string().min(10).max(200),
  verifiable_artifact: z.string().min(4).max(80),
});

export const RewriteSampleSchema = z.object({
  target_track_code: z.enum(TRACK_CODES),
  original: z.string().min(6).max(200),
  rewritten: z.string().min(6).max(200),
  what_changed: z.string().min(6).max(160),
});

/** 绝对化表述黑名单（Spec 9.4 硬性要求 7 / T3 断言）。命中即判校验失败。 */
export const ABSOLUTE_CLAIM_PATTERNS: readonly RegExp[] = [
  /保证入职/,
  /包(就业|入职|上岸)/,
  /薪资翻倍/,
  /100\s*%\s*匹配/,
  /必然成功/,
  /稳(赚|拿)/,
];

const PLAIN_TEXT_FIELDS = (v: {
  summary: string;
  track_matches: { caveat: string }[];
  top_gaps: { closing_action: string; why_it_matters: string }[];
  learning_path: { deliverable: string; why_this_deliverable: string }[];
}): string[] => [
  v.summary,
  ...v.track_matches.map((t) => t.caveat),
  ...v.top_gaps.flatMap((g) => [g.why_it_matters, g.closing_action]),
  ...v.learning_path.flatMap((p) => [p.deliverable, p.why_this_deliverable]),
];

export const DiagnosisPayloadSchema = z
  .object({
    out_of_scope: z.boolean(),
    out_of_scope_reason: z.string().max(300).nullable(),
    summary: z.string().min(20).max(200),
    transferable_skills: z.array(TransferableSkillSchema).min(5).max(8),
    track_matches: z.array(TrackMatchSchema).length(3),
    top_gaps: z.array(GapSchema).length(2),
    learning_path: z.array(PathStageSchema).length(3),
    rewrite_samples: z.array(RewriteSampleSchema).length(3),
  })
  .superRefine((v, ctx) => {
    const codes = new Set(v.track_matches.map((t) => t.track_code));
    if (codes.size !== 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['track_matches'],
        message: 'track_code 必须互不相同，三个赛道各出现一次',
      });
    }

    const stages = v.learning_path.map((p) => p.stage).join(',');
    if (stages !== PATH_STAGES.join(',')) {
      ctx.addIssue({
        code: 'custom',
        path: ['learning_path'],
        message: 'learning_path 阶段顺序必须是 0-1m,1-3m,3-6m',
      });
    }

    if (v.out_of_scope && !v.out_of_scope_reason) {
      ctx.addIssue({
        code: 'custom',
        path: ['out_of_scope_reason'],
        message: 'out_of_scope 为 true 时必须给出原因',
      });
    }

    for (const text of PLAIN_TEXT_FIELDS(v)) {
      const hit = ABSOLUTE_CLAIM_PATTERNS.find((p) => p.test(text));
      if (hit) {
        ctx.addIssue({
          code: 'custom',
          message: '输出包含绝对化表述，不符合内容合规要求',
        });
        break;
      }
    }
  });

export type DiagnosisPayloadParsed = z.infer<typeof DiagnosisPayloadSchema>;
