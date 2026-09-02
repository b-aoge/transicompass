import { cn } from './cn';
import { iconRegistry, type IconName } from './icons/registry';

/**
 * 图标统一出口（Spec §8.1 R4 / ADR-008）。业务组件一律经此消费，
 * 禁止直接 import lucide-react，禁止内联手写 <svg>，禁止 emoji 充当图标。
 *
 * 三档尺寸与线宽由设计令牌锁定，不接受中间值：
 *   16px→2 / 20px→1.75 / 24px→1.5
 * 实渲染线宽 = strokeWidth × size/24 = 1.33 / 1.46 / 1.50px，跨档视觉重量恒定。
 */
const SIZE = { sm: 16, md: 20, lg: 24 } as const;
const STROKE = { sm: 2, md: 1.75, lg: 1.5 } as const;

export type IconSize = keyof typeof SIZE;

export interface IconProps {
  name: IconName;
  size?: IconSize;
  /** 传了 label 视为语义图标（role=img + aria-label）；不传则视为装饰性，aria-hidden */
  label?: string;
  className?: string;
  /** 加载态旋转。带 .spinner 类，prefers-reduced-motion 下由 tokens.css 强制停转 */
  spin?: boolean;
}

export function Icon({ name, size = 'md', label, className, spin }: IconProps) {
  const Cmp = iconRegistry[name];
  return (
    <Cmp
      size={SIZE[size]}
      strokeWidth={STROKE[size]}
      className={cn('shrink-0', spin && 'spinner animate-spin', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    />
  );
}

export type { IconName };
