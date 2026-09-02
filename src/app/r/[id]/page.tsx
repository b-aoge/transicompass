'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SiteHeader } from '@/ui/SiteHeader';
import { ResultView } from '@/features/result/ResultView';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { useToast } from '@/ui/Toast';
import type { ResultView as RV } from '@/lib/types/api';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [view, setView] = useState<RV | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/v1/results/${id}`);
        const j = await r.json();
        if (j.code === 0 && j.data) setView(j.data);
        else setErr(j.message || '未找到该结果');
      } catch {
        setErr('加载失败，请重试');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function share() {
    const r = await fetch('/api/v1/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result_id: id }),
    });
    const j = await r.json();
    if (j.code === 0 && j.data?.share_url) {
      setShareUrl(j.data.share_url);
      try {
        await navigator.clipboard.writeText(j.data.share_url);
        toast.show('分享链接已复制', 'success');
      } catch {
        toast.show('链接已生成', 'info');
      }
    } else {
      toast.show('生成失败', 'error');
    }
  }

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
          <ResultView
            payload={view.payload}
            modelDisclosure={view.model_disclosure}
            disclaimer={view.disclaimer}
          />
        )}
        {view && (
          <div className="mt-6 flex flex-wrap gap-3 print-hidden">
            <Button icon="Link" variant="secondary" onClick={share}>
              生成分享链接
            </Button>
            <Button icon="Download" variant="ghost" onClick={() => window.print()}>
              打印 / 导出 PDF
            </Button>
          </div>
        )}
        {shareUrl && (
          <p className="mt-3 break-all text-sm text-meta print-hidden">分享链接：{shareUrl}</p>
        )}
      </main>
    </>
  );
}
