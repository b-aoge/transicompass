/**
 * 落地页领域常量（与架构师 openapi.yaml 的 track 枚举对齐）。
 * 真实提交时这些值原样传给后端；本回合前端基座不接入 API。
 */

export type ExperienceValue = 'lt_2' | '2_5' | '5_8' | '8_12' | 'gt_12';
export type DirectionValue =
  | 'NEW_ENERGY_STORAGE'
  | 'SMART_CONSTRUCTION_BIM'
  | 'ENGINEERING_B2B_OVERSEAS'
  | 'UNKNOWN';

export const EXPERIENCE_OPTIONS: { value: ExperienceValue; label: string }[] = [
  { value: 'lt_2', label: '< 2 年' },
  { value: '2_5', label: '2-5 年' },
  { value: '5_8', label: '5-8 年' },
  { value: '8_12', label: '8-12 年' },
  { value: 'gt_12', label: '12 年以上' },
];

export const DIRECTION_OPTIONS: { value: DirectionValue; label: string }[] = [
  { value: 'NEW_ENERGY_STORAGE', label: '新能源与储能' },
  { value: 'SMART_CONSTRUCTION_BIM', label: '智能建造与 BIM' },
  { value: 'ENGINEERING_B2B_OVERSEAS', label: '工程类 B2B 出海' },
  { value: 'UNKNOWN', label: '我还不知道' },
];

/** 「快速填入」模板：化解"不知道怎么写自己"的转化卡点 */
export const QUICK_FILL: { key: string; label: string; text: string }[] = [
  {
    key: 'build',
    label: '房建施工管理',
    text: '房建总包项目技术负责人，管过 3 个高层住宅项目，负责施工方案编制、进度计划、分包管理和竣工验收资料',
  },
  {
    key: 'municipal',
    label: '市政工程',
    text: '市政道路与管网项目现场负责人，统筹雨污水、桥梁及管廊施工，对接业主、监理与市政质监',
  },
  {
    key: 'mechanic',
    label: '机电安装',
    text: '机电安装专业工程师，负责商业综合体给排水、暖通与消防系统的深化设计、进场协调与调试验收',
  },
];

/** 真实产品输出样本（脱敏），用于首屏"翻译对照预览卡" */
export const PREVIEW_SAMPLE = {
  beforeLabel: '简历原文',
  before: '负责 5.2 万㎡住宅项目主体结构施工，协调甲方、监理及 6 家分包单位',
  afterLabel: '储能 EPC 项目管理语言',
  after: '多方接口管理与进度履约：统筹业主、监理及 6 家承包方，交付 5.2 万㎡工程节点',
  footnote: '这是产品实际输出的一条改写，来自一位 12 年房建从业者的脱敏样本',
};

/** 字数引导阈值：达标前给"还差多少"，正向文案 */
export const WORK_HINT_MIN = 20;
/** 提交的硬性下限：少于此值视为未填写 */
export const WORK_SUBMIT_MIN = 10;

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const UPLOAD_ACCEPT = '.pdf,.doc,.docx';
