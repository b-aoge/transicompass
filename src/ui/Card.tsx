import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

/**
 * Card —— 容器基元。
 *
 * 硬规则（设计系统 §7）：默认只有 1px 环（--elev-ring），不叠投影。
 * 1px 边框与 blur≥16px 投影禁止共存（幽灵卡片）。需要强调时换 ring-accent，
 * 或用 wash 底 + 淡边框，**不许**用彩色左边框。
 */
export type CardTone =
  | 'default'
  | 'accent'
  | 'wash'
  | 'sunken'
  | 'warn'
  | 'danger';

const TONE: Record<CardTone, string> = {
  default: 'bg-surface shadow-ring',
  accent: 'bg-surface shadow-ring-accent',
  wash: 'bg-accent-wash border border-accent-border',
  sunken: 'bg-surface-sunken',
  warn: 'bg-warn-wash border border-warn-border',
  danger: 'bg-danger-wash border border-danger-border',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  /** 关闭内边距，用于内部自行分区（如上下两半的对照卡） */
  flush?: boolean;
  children?: ReactNode;
}

export function Card({
  tone = 'default',
  flush = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md',
        TONE[tone],
        !flush && 'p-5 md:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  icon?: IconName;
  title: ReactNode;
  /** 标题右侧的计数 / 状态位 */
  aside?: ReactNode;
  /** 标题下方一行说明 */
  hint?: ReactNode;
  className?: string;
}

export function CardHeader({
  icon,
  title,
  aside,
  hint,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} size="md" className="text-accent" />}
        <h3 className="min-w-0 flex-1 text-xl">{title}</h3>
        {aside}
      </div>
      {hint && <p className="mt-1 text-sm text-meta">{hint}</p>}
    </div>
  );
}
