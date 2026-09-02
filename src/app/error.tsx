'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/ui/SiteHeader';
import { SiteFooter } from '@/ui/SiteFooter';
import { ErrorState } from '@/ui/ErrorState';
import { buttonClasses } from '@/ui/Button';

/**
 * 根段错误边界（App Router 约定文件）。捕获渲染期错误，
 * 给出真实标题 + 重试 / 回首页，技术栈信息折叠展示。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const detail = error?.message
    ? `${error.message}${error.digest ? ' · ' + error.digest : ''}`
    : undefined;

  return (
    <>
      <SiteHeader showBack />
      <main id="main" className="h-screen-safe flex items-center justify-center">
        <div className="container-reading px-4">
          <ErrorState
            kind="unknown"
            detail={detail}
            actions={
              <>
                <button onClick={reset} className={buttonClasses('primary', 'md')}>
                  重试
                </button>
                <Link href="/" className={buttonClasses('secondary', 'md')}>
                  回首页
                </Link>
              </>
            }
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
