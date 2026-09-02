import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Skeleton —— 骨架基元。
 *
 * 使用纪律（设计系统 §11 五态规范）：骨架屏必须按**真实结构**分块，
 * 不许拿三条通用灰条糊弄。用户看到的骨架形状应当能预告真实内容的形状，
 * 否则内容一出现就是一次布局跳变，反而更像"卡了"。
 *
 * 动效走 opacity 呼吸（.animate-pulse-soft），prefers-reduced-motion 下
 * 由 tokens.css 全局停掉，只留静态灰块。
 */
export function Skeleton({
  className,
  rounded = 'xs',
}: {
  className?: string;
  rounded?: 'xs' | 'sm' | 'md' | 'pill';
}) {
  const radius =
    rounded === 'md'
      ? 'rounded-md'
      : rounded === 'sm'
        ? 'rounded-sm'
        : rounded === 'pill'
          ? 'rounded-pill'
          : 'rounded-xs';
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse-soft bg-surface-sunken', radius, className)}
    />
  );
}

/**
 * 多行文本骨架。最后一行故意短一截，模拟真实段落的收尾。
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span className={cn('block space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </span>
  );
}

/**
 * 骨架容器：统一挂 aria-busy 与读屏兜底文案，避免屏幕阅读器读到一片空白。
 */
export function SkeletonRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
