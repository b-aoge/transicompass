import type { ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

/**
 * EmptyState —— 空态。
 *
 * 硬规则（Spec W1 / 设计系统 §11）：禁止「暂无数据」这类死胡同文案。
 * 空态必须给出**为什么空**和**下一步做什么**，且 action 必填。
 * 正确示范：「还没有诊断记录。填三个空，约 30 秒看到你的转型方向。」
 */
export function EmptyState({
  icon = 'Inbox',
  title,
  description,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  description: ReactNode;
  /** 必填：空态不留死胡同 */
  action: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 px-4 py-10 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-surface-sunken text-meta">
        <Icon name={icon} size="lg" />
      </span>
      <h4 className="text-lg text-fg">{title}</h4>
      <p className="max-w-[38ch] text-sm leading-body text-muted">
        {description}
      </p>
      <div className="mt-2">{action}</div>
    </div>
  );
}
