'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SiteHeader } from '@/ui/SiteHeader';
import { ResultView } from '@/features/result/ResultView';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import type { ResultView as RV } from '@/lib/types/api';

export default function PrintPage() {
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<RV | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/v1/results/${id}`);
        const j = await r.json();
        if (j.code === 0 && j.data) setView(j.data);
        else setErr(j.message || '未找到该结果');
      } catch {
        setErr('加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <>
      <SiteHeader showBack />
      <main id="main" className="container-reading py-6 md:py-10">
        <div className="mb-4 print-hidden">
          <Button icon="Download" onClick={() => window.print()}>
            打印 / 保存为 PDF
          </Button>
        </div>
        {loading && <p className="text-muted">加载中…</p>}
        {err && (
          <p className="flex items-center gap-2 text-danger">
            <Icon name="CircleAlert" size="sm" />
            {err}
          </p>
        )}
        {view && (
          <ResultView
            payload={view.payload}
            modelDisclosure={view.model_disclosure}
            disclaimer={view.disclaimer}
          />
        )}
      </main>
    </>
  );
}
