/**
 * 工程行业相关性预检（错误码 1004 的判定依据）。
 *
 * 目的不是替 AI 做判断，而是在调用模型之前拦掉明显无关的文本，
 * 省掉一次白烧的 token，同时给用户更快的反馈。
 * 判定刻意宽松：宁可放过，不可误杀——把边界情况交给模型的 out_of_scope 处理。
 */

import { CAPABILITY_MAP } from './capability-map';
import type { TrackCode } from '@/lib/types/domain';

/** 工程建设行业的通用词，任何一条赛道都不专属。 */
const INDUSTRY_TERMS: readonly string[] = [
  '施工', '工程', '项目', '工地', '监理', '甲方', '业主', '总包', '分包',
  '造价', '预算', '结算', '招标', '投标', '标书', '图纸', '验收', '竣工',
  '安全员', '施工员', '资料员', '技术员', '项目经理', '一建', '二建',
  '建造师', '设计院', '建筑', '土建', '市政', '安装', '装饰', '幕墙',
  '钢结构', '桥梁', '隧道', '地铁', '水利', '公路', '房建',
];

const MIN_INDUSTRY_HITS = 2;

export interface RelevanceResult {
  relevant: boolean;
  industryHits: number;
  /** 各赛道命中的关键词数，用于 mock 生成器排序 */
  trackHits: Record<TrackCode, number>;
}

function countHits(text: string, terms: readonly string[]): number {
  let hits = 0;
  for (const term of terms) {
    if (text.includes(term)) hits += 1;
  }
  return hits;
}

export function assessRelevance(text: string): RelevanceResult {
  const lower = text.toLowerCase();
  const industryHits = countHits(text, INDUSTRY_TERMS);

  const trackHits = {} as Record<TrackCode, number>;
  for (const [code, knowledge] of Object.entries(CAPABILITY_MAP) as [
    TrackCode,
    (typeof CAPABILITY_MAP)[TrackCode],
  ][]) {
    trackHits[code] = countHits(lower, knowledge.keywords.map((k) => k.toLowerCase()));
  }

  const totalTrackHits = Object.values(trackHits).reduce((a, b) => a + b, 0);

  return {
    relevant: industryHits >= MIN_INDUSTRY_HITS || totalTrackHits >= MIN_INDUSTRY_HITS,
    industryHits,
    trackHits,
  };
}

/** 按命中数降序返回赛道，命中相同时按枚举声明顺序稳定排序。 */
export function rankTracks(result: RelevanceResult): TrackCode[] {
  const codes = Object.keys(CAPABILITY_MAP) as TrackCode[];
  return [...codes].sort((a, b) => {
    const diff = (result.trackHits[b] ?? 0) - (result.trackHits[a] ?? 0);
    if (diff !== 0) return diff;
    return codes.indexOf(a) - codes.indexOf(b);
  });
}
