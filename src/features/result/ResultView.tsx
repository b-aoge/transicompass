'use client';

import { Card, CardHeader } from '@/ui/Card';
import { ScaleBar, BlockScale } from '@/ui/Progress';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { TRACK_KB } from '@/lib/knowledge';
import { getOpenRoles } from '@/lib/jobs/openRoles';
import type {
  DiagnosisPayload,
  TrackCode,
  ModelDisclosure,
  SkillStrength,
} from '@/lib/types/api';

const STRENGTH_VALUE: Record<SkillStrength, number> = { high: 5, medium: 3, low: 1 };
const LEVEL_TEXT: Record<'high' | 'medium' | 'low', string> = {
  high: '高度匹配',
  medium: '中等匹配',
  low: '初步匹配',
};

/**
 * 诊断结果渲染（Spec §8 版式）。推理依据占卡片主体（PIPL 24 条说明权）。
 * 共享视图（view_mode=shared）不展示任何留资/管理入口，仅只读。
 */
export function ResultView({
  payload,
  modelDisclosure,
  disclaimer,
}: {
  payload: DiagnosisPayload;
  modelDisclosure: ModelDisclosure;
  disclaimer: string;
}) {
  if (payload.out_of_scope) {
    return (
      <Card tone="warn" className="animate-fade-in">
        <CardHeader icon="TriangleAlert" title="暂未匹配到合适赛道" />
        <p className="leading-body text-fg-2">{payload.out_of_scope_reason}</p>
        <p className="mt-4 leading-body text-muted">{payload.summary}</p>
      </Card>
    );
  }

  // 按匹配分降序展示，排名决定 ScaleBar 同色系深浅
  const ranked = [...payload.track_matches].sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="space-y-6">
      <Card tone="accent" className="animate-fade-in">
        <CardHeader icon="Compass" title="一句话结论" />
        <p className="text-lg leading-body text-fg">{payload.summary}</p>
      </Card>

      <Card>
        <CardHeader
          icon="Layers"
          title="你的可迁移能力"
          hint="逐字出自你的履历，未做改写"
        />
        <ul className="hairline-y -my-3">
          {payload.transferable_skills.map((s) => (
            <li key={s.name} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-emphasize text-fg">{s.name}</p>
                  <p className="mt-1 text-sm leading-body text-muted">{s.description}</p>
                </div>
                <BlockScale
                  value={STRENGTH_VALUE[s.strength]}
                  label={`${s.name} 强度`}
                />
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-meta">
                <Icon name="Quote" size="sm" className="mt-0.5 shrink-0 text-accent" />
                <span className="leading-snug">{s.source_quote}</span>
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <section>
        <div className="mb-3 flex items-center gap-2 px-1">
          <Icon name="Target" size="md" className="text-accent" />
          <h2 className="text-xl">三条赛道匹配</h2>
        </div>
        <div className="space-y-4">
          {ranked.map((m, i) => {
            const kb = TRACK_KB[m.track_code as TrackCode];
            return (
              <Card
                key={m.track_code}
                tone={i === 0 ? 'accent' : 'default'}
                className="animate-rise-in"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg">{kb.label}</h3>
                  <span className="label-caps">
                    {LEVEL_TEXT[m.match_level]}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-sm text-meta">匹配度</span>
                    <span className="num text-2xl font-announce text-accent">
                      {m.match_score}
                    </span>
                  </div>
                  <ScaleBar value={m.match_score} rank={(i + 1) as 1 | 2 | 3} label={`${kb.label} 匹配度`} />
                </div>

                <div className="mt-4 space-y-3">
                  <p className="label-caps">为什么匹配（依据来自你的履历）</p>
                  {m.reasons.map((r, idx) => (
                    <div key={idx} className="rounded-sm bg-surface-sunken p-3">
                      <p className="flex items-start gap-1.5 text-sm text-fg-2">
                        <Icon name="Quote" size="sm" className="mt-0.5 shrink-0 text-accent" />
                        <span className="leading-snug">{r.source_quote}</span>
                      </p>
                      <p className="mt-2 pl-6 text-sm leading-snug text-muted">
                        → <span className="text-fg-2">{r.mapped_capability}</span>：
                        {r.target_scenario}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="label-caps mb-2">典型岗位</p>
                  <ChipGroupStatic items={m.typical_roles} />
                </div>

                <div className="mt-4">
                  <p className="label-caps mb-2">真实在招岗位（采集样例）</p>
                  <ul className="space-y-2">
                    {getOpenRoles(m.track_code as TrackCode, 3).map((job, ji) => (
                      <li key={ji} className="rounded-sm bg-surface-sunken p-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-emphasize text-fg">{job.title}</span>
                          <span className="num text-sm text-accent">{job.salary}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {job.company} · {job.city} · {job.experience}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-meta">
                    数据来源：BOSS直聘 · 采集方式：八爪鱼 RPA（样例，生产环境由定时任务刷新）
                  </p>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-sm bg-warn-wash p-3 text-sm text-fg-2">
                  <Icon name="TriangleAlert" size="sm" className="mt-0.5 shrink-0 text-warn" />
                  <span className="leading-snug">{m.caveat}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2 px-1">
          <Icon name="Route" size="md" className="text-accent" />
          <h2 className="text-xl">三阶段学习路径</h2>
        </div>
        <div className="space-y-3">
          {payload.learning_path.map((p) => (
            <Card key={p.stage} className="animate-rise-in">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 items-center rounded-pill bg-accent-wash px-3 text-sm font-emphasize text-accent">
                  {p.stage === '0-1m' ? '0–1 月' : p.stage === '1-3m' ? '1–3 月' : '3–6 月'}
                </span>
                <p className="font-emphasize text-fg">{p.deliverable}</p>
              </div>
              <p className="mt-2 text-sm leading-body text-muted">{p.why_this_deliverable}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-meta">
                <Icon name="Milestone" size="sm" className="shrink-0 text-accent" />
                <span>可验证产出：{p.verifiable_artifact}</span>
              </p>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader icon="Repeat2" title="履历改写示例" hint="把工程措辞换成目标赛道语言" />
        <div className="space-y-3">
          {payload.rewrite_samples.map((r, idx) => (
            <div key={idx} className="rounded-sm bg-surface-sunken p-3">
              <p className="text-sm text-muted">原：{r.original}</p>
              <p className="mt-2 text-sm text-fg-2">改：{r.rewritten}</p>
              <p className="mt-1 text-xs text-meta">{r.what_changed}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card tone="sunken" className="text-sm leading-body text-muted">
        <p>
          生成模型：{modelDisclosure.model_name}
          {modelDisclosure.registration_no && modelDisclosure.registration_no !== '—'
            ? `（生成式 AI 服务登记编号：${modelDisclosure.registration_no}）`
            : ''}
        </p>
        <p className="mt-2">{disclaimer}</p>
      </Card>
    </div>
  );
}

function ChipGroupStatic({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <Chip key={it} tone="ghost">
          {it}
        </Chip>
      ))}
    </div>
  );
}
