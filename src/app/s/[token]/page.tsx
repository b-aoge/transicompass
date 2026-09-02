'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/ui/SiteHeader';
import { ResultView } from '@/features/result/ResultView';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import type { ResultView as RV } from '@/lib/types/api';

export default function SharedPage() {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<RV | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/v1/share/${token}`);
        const j = await r.json();
        if (j.code === 0 && j.data) setView(j.data);
        else setErr(j.message || '分享链接无效或已过期');
      } catch {
        setErr('加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <>
      <SiteHeader showBack />
      <main id="main" className="container-reading py-6 md:py-10">
        {loading && <p className="text-muted">加载中…</p>}
        {err && (
          <p className="flex items-center gap-2 text-danger">
            <Icon name="CircleAlert" size="sm" />
            {err}
          </p>
        )}
        {view && (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-md bg-accent-wash p-3 text-sm text-fg-2 print-hidden">
              <Icon name="Share2" size="sm" className="text-accent" />
              <span>这是他人分享的诊断结果（只读）。</span>
              <Link href="/" className="ml-auto font-emphasize text-accent hover:underline">
                免费生成我的
              </Link>
            </div>
            <ResultView
              payload={view.payload}
              modelDisclosure={view.model_disclosure}
              disclaimer={view.disclaimer}
            />
          </>
        )}
        {view && (
          <div className="mt-6 print-hidden">
            <Button icon="Compass" onClick={() => (window.location.href = '/')}>
              生成我自己的转型诊断
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
