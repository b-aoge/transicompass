'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

/**
 * Checkbox —— 视觉 24×24，触控热区 44×44（WCAG 2.5.5）。
 *
 * 实现要点：原生 input 保留（键盘、读屏、表单语义全部免费拿到），
 * 用 sr-only 隐藏后由 peer 变体驱动视觉盒子。
 * 勾选标记不能用 peer-checked 直接控制（它是兄弟选择器，管不到孙子节点），
 * 所以改成「盒子控制 text color，图标吃 currentColor」——未勾选时图标透明。
 *
 * sr-only 需要显式 min-h-0 / min-w-0：globals.css 给所有 checkbox 兜了 44px
 * 最小尺寸，不解除会把隐藏 input 撑成 44px 的绝对定位块。
 */
export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  children: ReactNode;
  /** 校验未通过（如未勾选隐私授权就提交） */
  invalid?: boolean;
  /** 复选框下方的补充说明 */
  description?: ReactNode;
}

export function Checkbox({
  children,
  invalid,
  description,
  className,
  id,
  ...rest
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn('flex cursor-pointer items-start gap-2', className)}
    >
      <span className="relative -my-1 -ml-2 flex h-11 w-11 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          aria-invalid={invalid || undefined}
          className="peer sr-only min-h-0 min-w-0"
          {...rest}
        />
        <span
          aria-hidden="true"
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-xs border bg-surface text-transparent',
            'transition-[background-color,border-color,box-shadow] duration-fast ease-standard',
            invalid ? 'border-danger' : 'border-border-strong',
            'peer-hover:border-accent',
            'peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-on',
            'peer-focus-visible:shadow-focus',
            'peer-disabled:opacity-45',
          )}
        >
          <Icon name="Check" size="sm" />
        </span>
      </span>
      <span className="min-w-0 flex-1 pt-2">
        <span className="block text-base text-fg">{children}</span>
        {description && (
          <span className="mt-2 block text-sm leading-body text-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
