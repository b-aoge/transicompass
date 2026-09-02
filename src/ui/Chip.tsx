'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

/**
 * Chip —— 可点选项（分段选择器 / 单选方向 / 快速填入）。
 *
 * 选中态是「accent-wash 底 + accent 边框 + accent 文字 + check 图标」四重表达，
 * 其中 check 图标是硬要求：不允许只靠颜色区分选中，色盲用户必须可辨（§12）。
 *
 * 设计稿标注视觉高度 40px、热区补到 44px。这里直接取 44px：
 * globals.css 已对所有 button 兜底 min-height:44px，再做 40px 视觉盒 + ::before
 * 撑热区只会让两套规则打架，收益为零。
 */
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** ghost 用于「快速填入」这类辅助动作，不参与选中语义 */
  tone?: 'select' | 'ghost';
  children: ReactNode;
}

export function Chip({
  selected = false,
  tone = 'select',
  className,
  children,
  type = 'button',
  ...rest
}: ChipProps) {
  const isGhost = tone === 'ghost';
  return (
    <button
      type={type}
      aria-pressed={isGhost ? undefined : selected}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-sm border px-4 text-base',
        'transition-[background-color,border-color,color,box-shadow] duration-fast ease-standard',
        'focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-45',
        isGhost
          ? 'border-border bg-surface text-fg-2 hover:bg-surface-sunken active:bg-surface-sunken'
          : selected
            ? 'border-accent bg-accent-wash font-emphasize text-accent'
            : 'border-border bg-surface text-fg-2 hover:border-border-strong active:bg-surface-sunken',
        className,
      )}
      {...rest}
    >
      {!isGhost && selected && <Icon name="Check" size="sm" />}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}

/**
 * Chip 组容器。移动端 2 列网格，桌面自动流式排列。
 */
export function ChipGroup({
  label,
  columns = 2,
  children,
  className,
}: {
  /** 用作 role=group 的可访问名。单选组请在外层用 fieldset/legend */
  label: string;
  columns?: 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'grid gap-2',
        columns === 2 ? 'grid-cols-2' : 'grid-cols-3',
        'sm:flex sm:flex-wrap',
        className,
      )}
    >
      {children}
    </div>
  );
}
