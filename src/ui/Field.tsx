import type { ReactNode } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

/**
 * 表单字段外壳。label 强制可见 —— 严禁用 placeholder 顶替 label（设计系统 §5）。
 * 错误与说明通过 aria-describedby / aria-errormessage 关联，屏幕阅读器可读。
 */
export interface FieldProps {
  id: string;
  label: ReactNode;
  /** 字段说明，常驻显示，非错误 */
  hint?: ReactNode;
  /** 错误文案。有值即进入 error 态 */
  error?: string;
  /** 右上角计数等辅助信息 */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function fieldIds(id: string) {
  return { hintId: `${id}-hint`, errorId: `${id}-error` };
}

export function Field({
  id,
  label,
  hint,
  error,
  aside,
  children,
  className,
}: FieldProps) {
  const { hintId, errorId } = fieldIds(id);
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-sm font-emphasize tracking-small text-fg"
        >
          {label}
        </label>
        {aside}
      </div>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1 text-sm text-danger"
    >
      <Icon name="CircleAlert" size="sm" className="mt-1" />
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
}
