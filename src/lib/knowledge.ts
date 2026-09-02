import type { TrackCode } from './types/api';

/**
 * 赛道知识库（Spec §9 AI 调用规格）。
 * 这是大模型被「 grounding 」的权威依据：角色清单、风险提醒、学习路径模板，
 * 以及本地启发式降级用的关键词权重。保证不同简历产出不同但可信的结果。
 */

export interface TrackKB {
  code: TrackCode;
  label: string;
  short: string;
  /** 启发式评分关键词（命中即加权） */
  keywords: string[];
  typical_roles: string[];
  caveat: string;
  /** 三段式学习路径模板（按顺序 0-1m / 1-3m / 3-6m） */
  learning_path: {
    deliverable: string;
    why_this_deliverable: string;
    verifiable_artifact: string;
  }[];
  /** 改写样例模板：把工程履历措辞改成该赛道语言 */
  rewrite_angle: string;
}

export const TRACK_KB: Record<TrackCode, TrackKB> = {
  NEW_ENERGY_STORAGE: {
    code: 'NEW_ENERGY_STORAGE',
    label: '工商业储能',
    short: '新能源 / 储能',
    keywords: [
      '储能', '新能源', '光伏', '电池', '充电', '配电', '电力', '机电', '电气',
      '能源', '微电网', 'epc', 'EPC', '风电', '碳中和', '光储', '电站', '变压器',
      '供电', '负荷', '峰谷', '需量', 'EMS', 'BMS',
    ],
    typical_roles: [
      '储能方案工程师',
      '工商业储能项目经理',
      '能源管理顾问',
      '光储销售经理',
      '储能电站运维工程师',
      '储能售前解决方案',
    ],
    caveat: '储能赛道强政策与强商务双驱动，需补齐「电价套利模型 + 安全规范(GB)」两套语言，避免只谈工程不谈收益。',
    learning_path: [
      {
        deliverable: '独立完成一份 20MW 工商业储能 EPC 项目投标技术方案',
        why_this_deliverable: '把施工管理经验翻译成「收益测算 + 设备选型 + 并网」的储能语境',
        verifiable_artifact: '一份含容量配置与回本周期的方案 PDF',
      },
      {
        deliverable: '跑通一个园区峰谷套利测算模型（Excel/Python）',
        why_this_deliverable: '证明你能从「工程交付」切换到「资产收益」视角',
        verifiable_artifact: '可复用的测算模板 + 敏感性分析',
      },
      {
        deliverable: '拿到一道/储能相关岗位面试或一次商务对接',
        why_this_deliverable: '用真实项目语言验证赛道匹配，而非自证',
        verifiable_artifact: '面试记录或对接纪要',
      },
    ],
    rewrite_angle: '把「负责施工」改写为「主导储能电站从投标到并网交付的全周期管理」',
  },
  SMART_CONSTRUCTION_BIM: {
    code: 'SMART_CONSTRUCTION_BIM',
    label: '智能建造 / BIM',
    short: '智能建造 / BIM',
    keywords: [
      'BIM', '装配式', '智慧工地', '数字化', '建模', 'Revit', '智能建造', '施工图',
      '算量', '信息化', '模型', '三维', '孪生', 'CIM', '协同', '参数化', '深化设计',
    ],
    typical_roles: [
      'BIM 工程师',
      '智能建造产品经理',
      '数字孪生实施顾问',
      '装配式深化设计师',
      'BIM 项目主管',
      '智慧工地实施工程师',
    ],
    caveat: 'BIM 不是画图，是「数据驱动的协同」。需补「参数化建模 + 工程量自动提取 + 协同平台」能力，避免被当成传统制图。',
    learning_path: [
      {
        deliverable: '用一个真实项目产出一套可碰撞检测的 BIM 模型',
        why_this_deliverable: '把现场经验转成「模型即数据」的资产',
        verifiable_artifact: '模型文件 + 碰撞报告',
      },
      {
        deliverable: '搭建一个工程量自动提量流程（模型→清单）',
        why_this_deliverable: '证明你能用数据替代人工算量',
        verifiable_artifact: '提量脚本/插件 + 对比表',
      },
      {
        deliverable: '主导一次 BIM 协同平台落地或一次智能建造方案汇报',
        why_this_deliverable: '从执行者走向标准制定者',
        verifiable_artifact: '协同平台配置或汇报材料',
      },
    ],
    rewrite_angle: '把「现场管理」改写为「基于 BIM 的施工全过程数字化协同管理」',
  },
  ENGINEERING_B2B_OVERSEAS: {
    code: 'ENGINEERING_B2B_OVERSEAS',
    label: '工程出海 B2B',
    short: '工程出海 / B2B',
    keywords: [
      '海外', '出海', '国际', '外贸', '采购', '供应链', '寻源', '供应商', '商务',
      '投标', '报价', '合同', '英语', '跨境', 'B2B', '进出口', '外贸', '清关',
      '国际工程', 'EPC总承包', '信用证', 'FOB', 'CIF', '询盘', '客户',
    ],
    typical_roles: [
      '海外商务经理',
      '国际采购/供应链专家',
      '工程出海 BD',
      '跨境供应链运营',
      '海外大客户销售',
      '国际工程投标经理',
    ],
    caveat: '出海 B2B 的门槛在「商务 + 英语 + 合规」三件套，工程技术反而是你的信任背书而非障碍。需补国际贸易术语与跨文化商务。',
    learning_path: [
      {
        deliverable: '用英文独立完成一份海外工程设备采购询盘 + 比价表',
        why_this_deliverable: '把采购/供应链管理经验翻译成跨境商务语言',
        verifiable_artifact: '英文 RFQ + 比价表',
      },
      {
        deliverable: '梳理一个目标市场（如波兰/中东）的准入与渠道地图',
        why_this_deliverable: '证明你理解「市场进入」而非只懂「买东西」',
        verifiable_artifact: '市场准入清单 + 渠道表',
      },
      {
        deliverable: '拿到一次真实海外客户对接或样品单',
        why_this_deliverable: '用真实订单验证出海路径',
        verifiable_artifact: '客户沟通记录或询盘转化',
      },
    ],
    rewrite_angle: '把「负责采购」改写为「主导跨境供应链寻源与海外客户商务对接」',
  },
};

export const ALL_TRACKS: TrackCode[] = [
  'NEW_ENERGY_STORAGE',
  'SMART_CONSTRUCTION_BIM',
  'ENGINEERING_B2B_OVERSEAS',
];

/** 通用可迁移能力词库（启发式抽取时匹配） */
export const SKILL_KEYWORDS: { name: string; desc: string; strength: 'high' | 'medium' | 'low'; hit: string[] }[] = [
  { name: '项目全周期统筹', desc: '从投标、施工组织到交付验收的端到端推进能力', strength: 'high', hit: ['投标', '施工', '交付', '验收', '总包', '项目经理', '统筹'] },
  { name: '供应链与采购', desc: '供应商寻源、比价、合同与交付节奏把控', strength: 'high', hit: ['采购', '供应商', '寻源', '比价', '供应链', '合同', '招标'] },
  { name: '成本与商务报价', desc: '清单算量、成本测算与商务谈判', strength: 'medium', hit: ['成本', '报价', '算量', '预算', '商务', '结算'] },
  { name: '现场与质量安全管理', desc: '现场组织、质量红线与安全的落地执行', strength: 'high', hit: ['现场', '安全', '质量', '管理', '班组', '文明施工'] },
  { name: '客户与干系人沟通', desc: '甲方、监理、政府侧的协调与共识推进', strength: 'medium', hit: ['甲方', '监理', '协调', '沟通', '对接', '汇报'] },
  { name: '进度计划管控', desc: '横道图/网络计划编制与纠偏', strength: 'medium', hit: ['进度', '计划', '工期', '节点', '排期'] },
  { name: '机电与能源工程', desc: '电力、新能源相关的专业实施经验', strength: 'medium', hit: ['机电', '电气', '电力', '新能源', '储能', '光伏'] },
  { name: '数字化与信息化', desc: 'BIM/信息化系统的应用与推动', strength: 'low', hit: ['BIM', '数字化', '信息化', '系统', '智慧'] },
];
