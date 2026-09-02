import Link from 'next/link';
import { cn } from './cn';
import { Icon } from './Icon';

/**
 * 顶栏 56px，sticky。
 *
 * **刻意不放导航**：用户从小红书带着焦虑跳进来，唯一目标是拿到诊断结论。
 * 每多一个导航项就多一条跳出路径（设计系统 §10.1）。
 */
export function SiteHeader({
  /** 结果页/长文档页需要返回入口时传 true */
  showBack = false,
  backHref = '/',
  className,
}: {
  showBack?: boolean;
  backHref?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-sticky-header h-header border-b border-border bg-surface',
        className,
      )}
    >
      <div className="container-app flex h-full items-center gap-2">
        {showBack && (
          <Link
            href={backHref}
            aria-label="返回上一层"
            className="-ml-3 flex h-11 w-11 items-center justify-center rounded-sm text-fg-2 hover:bg-surface-sunken"
          >
            <Icon name="ChevronLeft" size="md" />
          </Link>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm text-fg"
          aria-label="转型罗盘首页"
        >
          <Icon name="LogoMark" size="lg" className="text-accent" />
          <span className="font-display text-lg font-announce tracking-heading">
            转型罗盘
          </span>
        </Link>
      </div>
    </header>
  );
}
