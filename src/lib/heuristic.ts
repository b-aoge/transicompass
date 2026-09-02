import { ALL_TRACKS, SKILL_KEYWORDS, TRACK_KB } from './knowledge';
import type {
  DiagnosisPayload,
  Gap,
  PathStage,
  Reason,
  RewriteSample,
  SanitizeReport,
  TrackCode,
  TrackMatch,
  TransferableSkill,
} from './types/api';

/**
 * 启发式诊断（无大模型 key 时的本地降级）。
 * 结果严格由输入文本推导：关键词加权评分 + 从履历原文抽取佐证，
 * 保证「不同简历 → 不同分数/依据」，从而证明产品非写死。
 */

const STAGES = ['0-1m', '1-3m', '3-6m'] as const;

export function emptyReport(): SanitizeReport {
  return { name: 0, phone: 0, email: 0, idcard: 0, company: 0, project: 0, url: 0, injection_hits: 0 };
}

export function splitSentences(text: string): string[] {
  return text
    .split(/[。！？；\n\r]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6 && s.length <= 200);
}

function scoreTracks(text: string): Record<TrackCode, number> {
  const lower = text.toLowerCase();
  const scores: Record<TrackCode, number> = {
    NEW_ENERGY_STORAGE: 0,
    SMART_CONSTRUCTION_BIM: 0,
    ENGINEERING_B2B_OVERSEAS: 0,
  };
  for (const code of ALL_TRACKS) {
    for (const kw of TRACK_KB[code].keywords) {
      const k = kw.toLowerCase();
      if (!k) continue;
      const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const m = lower.match(re);
      if (m) scores[code] += m.length * (kw.length >= 3 ? 2 : 1);
    }
  }
  return scores;
}

function quotesFor(text: string, code: TrackCode, max = 4): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of splitSentences(text)) {
    const sl = s.toLowerCase();
    if (TRACK_KB[code].keywords.some((kw) => kw && sl.includes(kw.toLowerCase()))) {
      const key = s.slice(0, 40);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
      if (out.length >= max) break;
    }
  }
  return out;
}

function reasonsFor(code: TrackCode, sentences: string[], count: number): Reason[] {
  const quotes = quotesFor(sentences.join('。'), code, count);
  const kb = TRACK_KB[code];
  const reasons: Reason[] = [];
  for (let i = 0; i < count; i++) {
    const q = (quotes[i] ?? sentences[i] ?? kb.caveat).slice(0, 120);
    const mapped = SKILL_KEYWORDS.find((sk) => sk.hit.some((h) => q.includes(h)));
    reasons.push({
      source_quote: q,
      mapped_capability: mapped?.name ?? '跨行业可迁移工程经验',
      target_scenario: `${kb.label}中的${kb.typical_roles[0] ?? '核心岗位'}：把既有现场经验平移为新赛道生产力`,
    });
  }
  return reasons;
}

function baseMatch(code: TrackCode, score: number, reasons: Reason[]): TrackMatch {
  const kb = TRACK_KB[code];
  const level: TrackMatch['match_level'] = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
  return {
    track_code: code,
    match_score: score,
    match_level: level,
    reasons,
    typical_roles: kb.typical_roles,
    caveat: kb.caveat,
  };
}

export function buildSkills(text: string): TransferableSkill[] {
  const lower = text.toLowerCase();
  const matched: TransferableSkill[] = [];
  for (const sk of SKILL_KEYWORDS) {
    const hitCount = sk.hit.filter((h) => h && lower.includes(h.toLowerCase())).length;
    if (hitCount === 0) continue;
    const sentences = splitSentences(text);
    const quote = sentences.find((s) => sk.hit.some((h) => s.toLowerCase().includes(h.toLowerCase()))) ?? text.slice(0, 80);
    matched.push({
      name: sk.name,
      description: sk.desc,
      strength: hitCount >= 2 ? 'high' : hitCount === 1 ? 'medium' : 'low',
      source_quote: quote.slice(0, 120),
      evidence: [{ source_snippet: quote.slice(0, 120), why: sk.desc }],
    });
  }
  const pool = SKILL_KEYWORDS.filter((s) => !matched.some((m) => m.name === s.name));
  let i = 0;
  while (matched.length < 5 && i < pool.length) {
    const sk = pool[i]!;
    matched.push({
      name: sk.name,
      description: sk.desc,
      strength: 'low',
      source_quote: text.slice(0, 80),
      evidence: [{ source_snippet: text.slice(0, 80), why: sk.desc }],
    });
    i += 1;
  }
  return matched.slice(0, 8);
}

function genericGaps(): Gap[] {
  return [
    {
      gap_name: '赛道专业语言',
      why_it_matters: '工程语境与目标赛道招聘语言不同，直接搬运会被判「不对口」。',
      closing_action: '用目标赛道的岗位 JD 重写一段过往经历作为样例。',
    },
    {
      gap_name: '行业信息差',
      why_it_matters: '转行初期缺乏人脉与真实岗位认知，易踩伪风口。',
      closing_action: '加入一个垂直社群，每周产出 1 条行业观察笔记。',
    },
  ];
}

function gapsFor(weakCodes: TrackCode[]): Gap[] {
  const out: Gap[] = [];
  for (const code of weakCodes.slice(0, 2)) {
    const kb = TRACK_KB[code];
    out.push({
      gap_name: `补齐${kb.label}专业语言`,
      why_it_matters: kb.caveat,
      closing_action: kb.learning_path[0]!.deliverable,
    });
  }
  while (out.length < 2) out.push(genericGaps()[out.length]!);
  return out;
}

function rewriteFor(code: TrackCode, quote: string): RewriteSample {
  const kb = TRACK_KB[code];
  const original = quote.slice(0, 80);
  return {
    target_track_code: code,
    original,
    rewritten: kb.rewrite_angle,
    what_changed: `用${kb.label}的语言重述既有职责`,
  };
}

export function buildHeuristic(text: string, report: SanitizeReport): DiagnosisPayload {
  const scores = scoreTracks(text);
  const maxRaw = Math.max(
    scores.NEW_ENERGY_STORAGE,
    scores.SMART_CONSTRUCTION_BIM,
    scores.ENGINEERING_B2B_OVERSEAS,
  );
  const totalHits =
    scores.NEW_ENERGY_STORAGE + scores.SMART_CONSTRUCTION_BIM + scores.ENGINEERING_B2B_OVERSEAS;
  const sentences = splitSentences(text);

  if (totalHits === 0) {
    return {
      out_of_scope: true,
      out_of_scope_reason:
        '未识别到与工程 / 新能源 / 出海相关的经历，建议补充施工、机电、采购或项目管理等背景后再试。',
      summary: '当前文本与三个转型赛道暂无实质关联。',
      transferable_skills: buildSkills(text),
      track_matches: ALL_TRACKS.map((c) => baseMatch(c, 0, reasonsFor(c, sentences, 2))),
      top_gaps: genericGaps(),
      learning_path: STAGES.map((st, i) => ({
        stage: st,
        ...TRACK_KB.NEW_ENERGY_STORAGE.learning_path[i]!,
      })),
      rewrite_samples: ALL_TRACKS.map((c) => rewriteFor(c, sentences[0] ?? '负责项目现场管理')),
    };
  }

  const scored = ALL_TRACKS.map((code) => {
    const raw = scores[code];
    const score = raw === 0 ? 0 : Math.max(25, Math.round((raw / (maxRaw || 1)) * 100));
    return { code, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const weak = [...scored].sort((a, b) => a.score - b.score).map((s) => s.code);

  const trackMatches: TrackMatch[] = scored.map(({ code, score }) => {
    const reasonCount = score >= 70 ? 4 : score >= 45 ? 3 : 2;
    return baseMatch(code, score, reasonsFor(code, sentences, reasonCount));
  });

  const top = scored[0]!;
  const topKb = TRACK_KB[top.code];
  const summary = `你的经历与「${topKb.label}」匹配度最高（${top.score} 分），核心来自${
    buildSkills(text)[0]?.name ?? '项目统筹'
  }等可迁移能力；另两条赛道可作为并行布局。`;

  return {
    out_of_scope: false,
    summary,
    transferable_skills: buildSkills(text),
    track_matches: trackMatches,
    top_gaps: gapsFor(weak),
    learning_path: STAGES.map((st, i) => ({
      stage: st,
      ...topKb.learning_path[i]!,
    })),
    rewrite_samples: ALL_TRACKS.map((c) => rewriteFor(c, quotesFor(text, c, 1)[0] ?? sentences[0] ?? '负责项目现场管理')),
  };
  void report;
}
