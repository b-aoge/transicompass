import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

/**
 * Button —— 覆盖状态矩阵 Default / Hover / Focus / Active / Disabled / Loading。
 *
 * 焦点环为什么要显式写 focus-visible:shadow-focus：
 * globals.css 的全局 :focus-visible 落在 base 层，而组件自身的 shadow-* 是
 * utilities 层，层级更靠后会把全局焦点环覆盖掉。凡是自带 shadow 的组件，
 * 都必须在此显式声明焦点态，否则键盘用户会丢失焦点提示。
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'danger-outline';

export type ButtonSize = 'lg' | 'md' | 'sm';

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-active focus-visible:shadow-focus',
  secondary:
    'border border-accent bg-transparent text-accent hover:bg-accent-wash active:bg-accent-wash focus-visible:shadow-focus',
  ghost:
    'bg-transparent text-fg-2 hover:bg-surface-sunken active:bg-surface-sunken focus-visible:shadow-focus',
  danger:
    'bg-danger text-white hover:opacity-90 active:opacity-100 focus-visible:shadow-focus-danger',
  'danger-outline':
    'border border-danger-border bg-transparent text-danger hover:bg-danger-wash active:bg-danger-wash focus-visible:shadow-focus-danger',
};

const SIZE: Record<ButtonSize, string> = {
  lg: 'h-[52px] px-6 text-base',
  md: 'h-11 px-5 text-base',
  // sm 仅用于桌面工具栏；移动端触控目标不得低于 44px，故需 min-h-0 解除全局兜底
  sm: 'h-9 min-h-0 px-4 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 前置图标，按设计系统语义映射表取名 */
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  /** 加载态替换文案，如「正在解析…」。不传则沿用 children */
  loadingText?: string;
  fullWidth?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  loading = false,
  loadingText,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const iconSize = size === 'lg' ? 'md' : 'sm';
  const label = loading && loadingText ? loadingText : children;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm font-announce',
        'transition-[background-color,color,box-shadow,opacity] duration-fast ease-standard',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="LoaderCircle" size={iconSize} spin />
      ) : (
        icon && iconPosition === 'start' && <Icon name={icon} size={iconSize} />
      )}
      {label}
      {!loading && icon && iconPosition === 'end' && (
        <Icon name={icon} size={iconSize} />
      )}
    </button>
  );
}

/**
 * 供 next/link 等非 button 元素复用按钮外观。
 * 注意：用在 <a> 上时必须自带 role 与键盘可达性（Link 天然可达）。
 */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-sm font-announce',
    'transition-[background-color,color,box-shadow,opacity] duration-fast ease-standard',
    VARIANT[variant],
    SIZE[size],
    fullWidth && 'w-full',
  );
}
