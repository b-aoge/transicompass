/**
 * 赛道能力映射表（ADR-009 / Spec 9.5）。
 *
 * 人工校订的静态数据，不引入 RAG 与向量库。三个赛道稳定且可审计，
 * 向量检索在这个量级属于过度工程，还会引入检索质量的不确定性。
 *
 * 两个用途：
 *   1. 注入 stage2 prompt 的 {{CAPABILITY_MAP}}，作为判断基线，优先于模型记忆
 *   2. AI 不可用时由 src/lib/llm/mock.ts 据此生成确定性降级结果
 *
 * caveat 字段是硬要求：每个赛道都必须说风险，这是对冲「伪风口」的可信度来源。
 */

import type { TrackCode } from '@/lib/types/domain';

export interface TransferableSource {
  from: string;
  why: string;
}

export interface TrackKnowledge {
  name: string;
  core_capabilities: readonly string[];
  transferable_from: readonly TransferableSource[];
  common_gaps: readonly string[];
  typical_roles: readonly string[];
  caveat: string;
  /** 命中即视为该赛道相关，用于 mock 生成器与工程行业相关性预检 */
  keywords: readonly string[];
}

export const CAPABILITY_MAP: Record<TrackCode, TrackKnowledge> = {
  NEW_ENERGY_STORAGE: {
    name: '新能源与储能',
    core_capabilities: [
      'EPC 总承包管理',
      '电气一次与二次基础',
      '并网与验收流程',
      '投标技术方案编制',
      '业主与电网协调',
    ],
    transferable_from: [
      {
        from: '房建与市政项目管理',
        why: '进度、成本、分包管理逻辑同构，储能 EPC 项目周期更短但结构相似',
      },
      {
        from: '机电安装',
        why: '电气施工与调试经验可直接迁移至储能系统集成与并网调试',
      },
      {
        from: '造价与商务',
        why: '储能项目度电成本测算与工程量清单编制方法论相通',
      },
    ],
    common_gaps: ['电化学与 BMS 基础知识', '电力市场与峰谷套利商业模型'],
    typical_roles: [
      '储能项目经理',
      '储能 EPC 技术经理',
      '新能源项目开发',
      '储能系统集成工程师',
      '储能电站运维工程师',
      '工商业储能销售经理',
    ],
    caveat:
      '储能行业价格竞争激烈，项目集中于少数央国企与头部集成商，跳槽前需确认目标企业订单储备。',
    keywords: ['电气', '光伏', '储能', '并网', '变电', '电力', '机电', 'EPC', '新能源', '调试'],
  },

  SMART_CONSTRUCTION_BIM: {
    name: '智能建造与 BIM',
    core_capabilities: [
      'BIM 建模与模型审查',
      '施工深化设计与碰撞检查',
      '进度与成本的模型关联',
      '装配式构件深化',
      '数字化交付标准落地',
    ],
    transferable_from: [
      {
        from: '施工技术与技术负责人',
        why: '图纸会审、深化设计、方案交底的经验是模型审查与施工模拟的直接底座',
      },
      {
        from: '设计院制图与出图',
        why: '空间几何与规范理解可平移至建模与合规性检查，补软件操作即可上手',
      },
      {
        from: '项目计划与进度管理',
        why: '进度计划与模型挂接是四维施工模拟的核心，管理经验比软件更难替代',
      },
    ],
    common_gaps: ['主流建模与协同平台的熟练操作', '数据标准与交付规范的工程化落地经验'],
    typical_roles: [
      'BIM 工程师',
      'BIM 技术负责人',
      '智能建造实施顾问',
      '数字化交付专员',
      'BIM 项目主管',
      '智慧工地工程师',
    ],
    caveat:
      '不少企业的 BIM 岗仍停留在翻模与出效果图，薪资天花板明显。选岗前需确认岗位是否真正参与施工决策，而不是被当作绘图外包。',
    keywords: ['BIM', '深化设计', '图纸', '装配式', '施工技术', '建模', 'revit', '数字化', '技术负责人'],
  },

  ENGINEERING_B2B_OVERSEAS: {
    name: '工程类 B2B 出海',
    core_capabilities: [
      '国际工程投标与合同管理',
      'FIDIC 条款与索赔管理',
      '跨境供应链与报关协同',
      '海外业主与分包沟通',
      '属地化用工与合规',
    ],
    transferable_from: [
      {
        from: '国内总承包项目管理',
        why: '合同、进度、分包、变更索赔的管理框架在海外项目上同构，差异在法律与文化环境',
      },
      {
        from: '商务与合约管理',
        why: 'FIDIC 与国内合同示范文本的风险分配逻辑相通，条款理解能力可直接迁移',
      },
      {
        from: '工程设备与材料采购',
        why: '供应商评估与验收标准的经验可平移至跨境采购与物流协同',
      },
    ],
    common_gaps: ['可支撑谈判的工作语言能力', '目标国法律税务与属地用工规则'],
    typical_roles: [
      '海外项目经理',
      '国际商务经理',
      '海外市场开发',
      '合约与索赔工程师',
      '海外大客户销售',
      '国际采购专员',
    ],
    caveat:
      '海外岗位普遍要求长期驻外，家庭与健康成本高于国内岗位，且部分区域存在安全与汇率风险。薪资溢价需扣除这些隐性成本后再比较。',
    keywords: ['海外', '国际', 'FIDIC', '出海', '英语', '总包', '商务', '合约', '索赔', '投标'],
  },
};

/** 注入 stage2 prompt 的纯文本视图，避免把整个对象塞进 prompt 浪费 token。 */
export function renderCapabilityMap(): string {
  return (Object.entries(CAPABILITY_MAP) as [TrackCode, TrackKnowledge][])
    .map(([code, t]) => {
      const sources = t.transferable_from.map((s) => `${s.from}（${s.why}）`).join('；');
      return [
        `### ${code} ${t.name}`,
        `核心能力要求：${t.core_capabilities.join('、')}`,
        `常见迁移来源：${sources}`,
        `常见能力缺口：${t.common_gaps.join('、')}`,
        `典型岗位：${t.typical_roles.join('、')}`,
        `风险提醒：${t.caveat}`,
      ].join('\n');
    })
    .join('\n\n');
}
