import type { TextareaHTMLAttributes } from 'react';
import { cn } from './cn';
import { inputBaseClass } from './Input';

/**
 * Textarea —— 多行输入。min-height 96px（约 4 行），允许纵向拉伸，
 * 禁止横向拉伸（会撑破 375px 布局）。
 *
 * 字数引导一律走正向文案（「再写 20 字，诊断会更准」），
 * 不做负向报错 —— 目标用户卡在"不知道怎么写自己"，负向提示会直接劝退。
 */
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBaseClass,
        'block min-h-[96px] resize-y py-3 leading-body',
        invalid
          ? 'border-danger focus-visible:shadow-focus-danger'
          : 'border-border-strong hover:border-muted focus-visible:border-accent focus-visible:shadow-focus',
        className,
      )}
      {...rest}
    />
  );
}

/**
 * 字数进度提示。达标前给"还差多少"，达标后给确认，全程正向。
 */
export function LengthHint({
  value,
  min,
}: {
  value: string;
  min: number;
}) {
  const len = value.trim().length;
  if (len === 0) return null;
  if (len < min) {
    return (
      <span className="text-sm text-muted">
        再写 <span className="num">{min - len}</span> 字，诊断会更准
      </span>
    );
  }
  return (
    <span className="text-sm text-muted">
      已写 <span className="num">{len}</span> 字，够用了
    </span>
  );
}
