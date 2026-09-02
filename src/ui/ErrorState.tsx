import type { ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

/**
 * ErrorState —— 全站统一的失败态版式（设计系统 §10.9）。
 *
 * 两条硬规则：
 * 1. **按错误类型给真实标题**，不许出现通用的「出错了」。用户需要知道
 *    是网络断了还是模型挂了，才能判断"重试有没有用"。
 * 2. **不留死胡同**：每种终态都必须至少给一个下一步动作。
 *
 * 原始技术错误码收进折叠的 <details>，默认收起 —— 给排查用，不吓用户。
 */
export type ErrorKind =
  | 'ai_unavailable'
  | 'network'
  | 'not_found'
  | 'rate_limited'
  | 'link_expired'
  | 'link_invalid'
  | 'link_deleted'
  | 'unknown';

interface ErrorCopy {
  icon: IconName;
  title: string;
  description: string;
}

export const ERROR_COPY: Record<ErrorKind, ErrorCopy> = {
  ai_unavailable: {
    icon: 'CircleAlert',
    title: 'AI 服务暂时没响应',
    description:
      '你的经历没有丢，重试一次通常就好。如果不想等，可以留个邮箱，算完我们推给你。',
  },
  network: {
    icon: 'CircleAlert',
    title: '网络好像断了',
    description: '检查一下网络连接再试。在电梯或工地地下室时这种情况比较常见。',
  },
  not_found: {
    icon: 'CircleAlert',
    title: '这个页面不存在',
    description: '链接可能被截断了，或者页面已经改过地址。回首页重新开始吧。',
  },
  rate_limited: {
    icon: 'CircleAlert',
    title: '请求有点多，稍等一下',
    description: '同一个网络下短时间内提交次数较多，等一会儿再试就行。',
  },
  link_expired: {
    icon: 'Link2Off',
    title: '这个分享链接已过期',
    description: '分享链接有效期为 7 天。你可以自己做一份，同样免费、不用注册。',
  },
  link_invalid: {
    icon: 'Link2Off',
    title: '这个链接无效',
    description: '链接可能在转发时被截断了。让分享的人重新生成一次，或者自己做一份。',
  },
  link_deleted: {
    icon: 'Link2Off',
    title: '报告所有者已删除这份数据',
    description: '按我们的隐私承诺，删除后原文与诊断结果会一并清除，无法恢复。',
  },
  unknown: {
    icon: 'CircleAlert',
    title: '这一步没能走通',
    description: '我们已经记下这次失败。你可以重试一次，或者换个入口继续。',
  },
};

export interface ErrorStateProps {
  kind: ErrorKind;
  /** 覆盖默认标题（如模块级降级：「这一项没能生成」） */
  title?: string;
  description?: ReactNode;
  /** 至少给一个下一步动作。不留死胡同是硬规则 */
  actions: ReactNode;
  /** 技术错误码，折叠展示，默认收起 */
  detail?: string;
  /** page：整页居中；inline：模块内嵌降级 */
  variant?: 'page' | 'inline';
  className?: string;
}

export function ErrorState({
  kind,
  title,
  description,
  actions,
  detail,
  variant = 'page',
  className,
}: ErrorStateProps) {
  const copy = ERROR_COPY[kind];
  const isPage = variant === 'page';

  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        isPage
          ? 'mx-auto max-w-[480px] items-center py-16 text-center'
          : 'items-start text-left',
        className,
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-pill bg-danger-wash text-danger',
          isPage ? 'h-14 w-14' : 'h-10 w-10',
        )}
      >
        <Icon name={copy.icon} size="lg" />
      </span>

      <h2 className={cn(isPage ? 'text-xl' : 'text-lg')}>
        {title ?? copy.title}
      </h2>

      <p
        className={cn(
          'leading-body text-muted',
          isPage ? 'text-base' : 'text-sm',
        )}
      >
        {description ?? copy.description}
      </p>

      <div
        className={cn(
          'mt-2 flex w-full flex-wrap gap-3',
          isPage ? 'justify-center' : 'justify-start',
        )}
      >
        {actions}
      </div>

      {detail && (
        <details className="mt-4 w-full text-left">
          <summary className="cursor-pointer list-none text-xs text-meta underline underline-offset-4">
            技术详情
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-sm bg-surface-sunken p-3 font-mono text-xs text-meta">
            {detail}
          </pre>
        </details>
      )}
    </div>
  );
}
