import type { ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

/**
 * Badge —— 静态标记（计数、状态、「最匹配」「可写进简历」）。
 * 仅此处允许 pill 圆角；按钮、卡片一律走 4-14px 的四级圆角。
 *
 * accent 实心是稀缺资源：每屏可见的饱和 accent ≤ 2 处（设计系统 §2 预算表），
 * 用之前先确认这一屏还有没有额度。
 */
export type BadgeTone = 'accent' | 'neutral' | 'warn' | 'success' | 'danger';

const TONE: Record<BadgeTone, string> = {
  accent: 'bg-accent text-accent-on',
  neutral: 'bg-surface-sunken text-fg-2',
  warn: 'bg-warn-wash text-warn border border-warn-border',
  success: 'bg-success-wash text-success border border-success-border',
  danger: 'bg-danger-wash text-danger border border-danger-border',
};

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-emphasize tracking-small',
        TONE[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size="sm" />}
      {children}
    </span>
  );
}
