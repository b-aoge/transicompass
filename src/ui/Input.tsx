import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

/**
 * Input —— 单行输入。状态：Default / Hover / Focus / Disabled / Error。
 *
 * 高度 44px（同时是触控目标下限），--surface 底 + 1px --border-strong。
 * focus 边框转 accent 并叠 --focus-ring；error 边框转 danger 并叠 danger ring。
 * 字号锁 16px：低于 16px 会触发 iOS Safari 聚焦自动放大，在微信内置浏览器里
 * 表现为整页被顶歪。
 */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  invalid?: boolean;
}

export const inputBaseClass =
  'w-full rounded-sm bg-surface px-3 text-base text-fg placeholder:text-meta ' +
  'border transition-[border-color,box-shadow] duration-fast ease-standard ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted';

export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        inputBaseClass,
        'h-11',
        invalid
          ? 'border-danger focus-visible:shadow-focus-danger'
          : 'border-border-strong hover:border-muted focus-visible:border-accent focus-visible:shadow-focus',
        className,
      )}
      {...rest}
    />
  );
}
