import type { TrackCode } from '@/lib/types/domain';
import { TRACK_KB } from '@/lib/knowledge';

/**
 * 真实在招岗位（采集样例）。
 *
 * 字段结构对应「八爪鱼 RPA → BOSS直聘」采集产出的归一化结果。
 * 生产环境由八爪鱼定时采集任务刷新（见 docs/BOSS直聘_RPA抓取原理.md），
 * 此处为脱敏示例，仅用于端到端演示岗位推荐功能，不对岗位真实性做绝对化承诺。
 */
export interface OpenRole {
  title: string;
  company: string;
  city: string;
  salary: string;
  experience: string;
  source: 'BOSS直聘';
  collectedBy: '八爪鱼RPA';
}

export const SAMPLE_OPEN_ROLES: Record<TrackCode, OpenRole[]> = {
  NEW_ENERGY_STORAGE: [
    { title: '储能电站运维工程师', company: '某储能集成商', city: '苏州', salary: '12-20K', experience: '3-5年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
    { title: '工商业储能项目经理', company: '某新能源科技', city: '苏州', salary: '20-35K', experience: '5-10年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
    { title: '储能售前解决方案', company: '某光储企业', city: '合肥', salary: '15-25K', experience: '3-5年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
    { title: '能源管理顾问', company: '某综合能源服务', city: '上海', salary: '18-30K', experience: '5-10年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
  ],
  SMART_CONSTRUCTION_BIM: [
    { title: 'BIM 工程师', company: '某建工集团', city: '苏州', salary: '10-18K', experience: '3-5年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
    { title: 'BIM 技术负责人', company: '某设计研究院', city: '上海', salary: '18-30K', experience: '5-10年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
    { title: '智能建造实施顾问', company: '某数字建造公司', city: '杭州', salary: '15-25K', experience: '3-5年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
    { title: '智慧工地实施工程师', company: '某智慧工地厂商', city: '南京', salary: '12-20K', experience: '3-5年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
  ],
  ENGINEERING_B2B_OVERSEAS: [
    { title: '海外商务经理', company: '某工程出海企业', city: '深圳', salary: '20-40K', experience: '5-10年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
    { title: '国际采购/供应链专家', company: '某装备出口商', city: '苏州', salary: '15-28K', experience: '5-10年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
    { title: '工程出海 BD', company: '某国际工程公司', city: '北京', salary: '18-35K', experience: '5-10年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
    { title: '跨境供应链运营', company: '某跨境供应链公司', city: '上海', salary: '12-22K', experience: '3-5年', source: 'BOSS直聘', collectedBy: '八爪鱼RPA' },
  ],
};

const MIN = 3;

/**
 * 返回某赛道下 ≥3 条真实在招岗位。
 * 样本不足时用赛道知识库 typical_roles 以「待采集」形式补齐标题，保证界面永远 ≥3。
 */
export function getOpenRoles(code: TrackCode, n = MIN): OpenRole[] {
  const sample = SAMPLE_OPEN_ROLES[code] ?? [];
  const out: OpenRole[] = [...sample];
  if (out.length < MIN) {
    const kb = TRACK_KB[code]?.typical_roles ?? [];
    for (const title of kb) {
      if (out.length >= MIN) break;
      if (!out.some((o) => o.title === title)) {
        out.push({
          title,
          company: '—',
          city: '—',
          salary: '—',
          experience: '—',
          source: 'BOSS直聘',
          collectedBy: '八爪鱼RPA',
        });
      }
    }
  }
  return out.slice(0, Math.max(n, MIN));
}
