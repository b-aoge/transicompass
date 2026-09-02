/**
 * 图标登记表 —— 全项目唯一的图标来源清单（Spec §8.1 R3/R4，ADR-008）。
 *
 * 为什么是显式具名 import 而不是 Spec 示例里的 `import * as Lucide`：
 * 命名空间导入会把整个 lucide-react 拉进 chunk，摇树失效（约 1.4MB ESM），
 * 直接撞 §11.1「首屏 JS ≤ 180KB」的性能门禁。显式登记同样满足
 * 「业务组件不得直接 import lucide-react」的单出口约束，且新增图标必须
 * 先在此登记 —— 反而比命名空间导入更能拦住"随手换图标"。
 *
 * 图标名严格取自设计系统 §4 语义映射表，禁止同义换名。
 */
import {
  ArrowDown,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleCheck,
  Compass,
  Copy,
  Download,
  FileText,
  FileUp,
  Gauge,
  HardHat,
  House,
  Inbox,
  Info,
  Layers,
  Link,
  Link2Off,
  LoaderCircle,
  Mail,
  Milestone,
  Package,
  PackageCheck,
  PenLine,
  Quote,
  Repeat2,
  RotateCcw,
  Route,
  Share2,
  ShieldCheck,
  Target,
  Trash2,
  TriangleAlert,
  Upload,
  Users,
  X,
} from 'lucide-react';

import { LogoMark } from './custom/LogoMark';

export const iconRegistry = {
  // 输入与表单
  Upload,
  FileUp,
  FileText,
  PenLine,
  CalendarClock,
  HardHat,
  Compass,
  ShieldCheck,
  // 结果与数据
  Layers,
  Repeat2,
  Gauge,
  Target,
  Quote,
  TriangleAlert,
  Milestone,
  Route,
  Package,
  PackageCheck,
  // 操作
  Download,
  Share2,
  Copy,
  Trash2,
  RotateCcw,
  Users,
  CalendarCheck,
  Mail,
  // 状态
  LoaderCircle,
  CircleCheck,
  CircleAlert,
  Circle,
  Inbox,
  Info,
  Link,
  Link2Off,
  // 导航与控件
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowRight,
  House,
  X,
  // 自定义（Spec R3：24 网格 / 1.5px 描边，与 Lucide 同构）
  LogoMark,
} as const;

export type IconName = keyof typeof iconRegistry;
