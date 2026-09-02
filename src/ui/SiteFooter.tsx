import Link from 'next/link';
import { cn } from './cn';

/**
 * 页脚。隐私政策与用户协议是**独立文档**，不做成页脚小字里的一行灰字
 * （PIPL 合规要求 + PM 明确指示）。这里只是入口，正文各自成页。
 */
const LINKS = [
  { href: '/legal/privacy', text: '隐私政策' },
  { href: '/legal/terms', text: '用户协议' },
];

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('mt-16 border-t border-border bg-surface', className)}>
      <div className="container-app py-8">
        <nav aria-label="法律文档" className="flex flex-wrap items-center gap-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-sm text-sm text-fg-2 underline underline-offset-4 hover:text-accent"
            >
              {l.text}
            </Link>
          ))}
        </nav>
        <p className="mt-4 max-w-[60ch] text-xs leading-body text-meta">
          转型罗盘的诊断结论由 AI 生成，为辅助参考，不构成职业中介服务、就业承诺或投资建议。
          建议结合行业实际与专业意见判断。
        </p>
      </div>
    </footer>
  );
}
