'use client';

import { useState, useRef } from 'react';
import { Button } from '@/ui/Button';
import { Card, CardHeader } from '@/ui/Card';
import { Textarea, LengthHint } from '@/ui/Textarea';
import { Checkbox } from '@/ui/Checkbox';
import { Chip, ChipGroup } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { useToast } from '@/ui/Toast';
import { ResultView } from '@/features/result/ResultView';
import { sanitizePII } from '@/lib/client/sanitize';
import type { DiagnosisPayload, ResultView as ResultViewT } from '@/lib/types/api';

const POLICY_VERSION = '2026-08-01';
const MIN_LEN = 80;

type CEvent =
  | { event: 'accepted'; data: { result_id: string; session_id: string } }
  | { event: 'progress'; data: { stage: string; percent: number } }
  | { event: 'skills'; data: { transferable_skills: unknown[] } }
  | { event: 'matches'; data: { track_matches: unknown[]; top_gaps: unknown[] } }
  | { event: 'path'; data: { learning_path: unknown[]; rewrite_samples: unknown[] } }
  | { event: 'done'; data: { result_id: string; status: string; out_of_scope: boolean } }
  | { event: 'failed'; data: { code: number; message: string } };

const STAGE_TEXT: Record<string, string> = {
  extracting: '正在提取你的履历要点',
  matching: '正在匹配三条赛道',
  path: '正在生成学习路径',
};

function parseSSEPart(part: string): CEvent | null {
  let event = '';
  let data = '';
  for (const line of part.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!event) return null;
  try {
    return { event, data: JSON.parse(data) } as CEvent;
  } catch {
    return null;
  }
}

async function consumeSSE(res: Response, onEvent: (e: CEvent) => void): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error('no stream');
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop() ?? '';
    for (const p of parts) {
      const ev = parseSSEPart(p);
      if (ev) onEvent(ev);
    }
  }
}

export function UploadFlow() {
  const toast = useToast();
  const [mode, setMode] = useState<'resume' | 'form'>('resume');
  const [text, setText] = useState('');
  const [years, setYears] = useState('10');
  const [mainWork, setMainWork] = useState('');
  const [target, setTarget] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState<ResultViewT | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultIdRef = useRef<string | null>(null);

  async function handleFile(f: File) {
    try {
      let content = '';
      const name = f.name.toLowerCase();
      if (name.endsWith('.txt')) {
        content = await f.text();
      } else if (name.endsWith('.pdf')) {
        const pdfjs = await import('pdfjs-dist');
        const buf = await f.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const c = await page.getTextContent();
          pages.push(c.items.map((it: { str?: string }) => it.str ?? '').join(' '));
        }
        content = pages.join('\n');
      } else if (name.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const buf = await f.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer: buf });
        content = res.value;
      } else {
        toast.show('仅支持 PDF / DOCX / TXT，可直接粘贴文本', 'error');
        return;
      }
      setText(content.slice(0, 20000));
      toast.show('已读取文件，已自动脱敏', 'success');
    } catch {
      toast.show('自动解析失败，请直接粘贴文本', 'error');
    }
  }

  async function submit() {
    setError(null);
    if (!accepted) {
      setError('请先勾选隐私授权');
      return;
    }
    if (mode === 'resume') {
      if (text.trim().length < MIN_LEN) {
        setError(`履历至少 ${MIN_LEN} 字，当前 ${text.trim().length} 字`);
        return;
      }
    } else {
      if (mainWork.trim().length < 20) {
        setError('请填写主要工作内容（至少 20 字）');
        return;
      }
    }

    setBusy(true);
    setResult(null);
    setResultId(null);
    setShareUrl(null);
    setPercent(15);
    setStage('extracting');

    const composed =
      mode === 'resume'
        ? text
        : `从业${Number(years) || 0}年。${mainWork} 目标方向：${target || '不知道'}`;
    const { text: clean, report } = sanitizePII(composed);
    const body: Record<string, unknown> = {
      input_type: mode,
      sanitized_text: clean,
      sanitize_report: report,
      privacy_consent: {
        accepted: true,
        policy_version: POLICY_VERSION,
        accepted_at: new Date().toISOString(),
      },
    };
    if (mode === 'form') {
      const cleanWork = sanitizePII(mainWork).text;
      body.form = {
        years_of_experience: Number(years) || 0,
        main_work: cleanWork,
        target_direction: target || '不知道',
      };
    }

    try {
      const res = await fetch('/api/v1/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) throw new Error('stream failed');
      await consumeSSE(res, (ev) => {
        if (ev.event === 'progress') {
          setPercent(ev.data.percent);
          setStage(ev.data.stage);
        } else if (ev.event === 'failed') {
          setError(ev.data.message);
        } else if (ev.event === 'done') {
          setResultId(ev.data.result_id);
        }
      });
      if (resultIdRef.current) {
        await loadResult(resultIdRef.current);
      }
    } catch {
      setError('诊断连接中断，请重试');
    } finally {
      setBusy(false);
      setPercent(0);
      setStage('');
    }
  }

  resultIdRef.current = resultId;

  async function loadResult(id: string) {
    try {
      const r = await fetch(`/api/v1/results/${id}`);
      const json = await r.json();
      if (json.code === 0 && json.data) setResult(json.data as ResultViewT);
    } catch {
      setError('结果加载失败，请刷新重试');
    }
  }

  async function doShare() {
    if (!resultId) return;
    const r = await fetch('/api/v1/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result_id: resultId }),
    });
    const json = await r.json();
    if (json.code === 0 && json.data?.share_url) {
      setShareUrl(json.data.share_url);
      try {
        await navigator.clipboard.writeText(json.data.share_url);
        toast.show('分享链接已复制', 'success');
      } catch {
        toast.show('分享链接已生成', 'info');
      }
    } else {
      toast.show('生成分享链接失败', 'error');
    }
  }

  async function joinCommunity() {
    const r = await fetch('/api/v1/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cta_type: 'community',
        contact_type: 'wechat',
        contact: 'wx-placeholder',
        consent: { accepted: true, policy_version: POLICY_VERSION },
      }),
    });
    const json = await r.json();
    if (json.code === 0) {
      const na = json.data?.next_action;
      toast.show(na?.hint ?? '已加入队列', 'success');
    } else {
      toast.show('提交失败，请重试', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Chip
            selected={mode === 'resume'}
            onClick={() => setMode('resume')}
          >
            贴履历 / 传文件
          </Chip>
          <Chip selected={mode === 'form'} onClick={() => setMode('form')}>
            填表单
          </Chip>
        </div>

        {mode === 'resume' ? (
          <>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="把简历正文粘贴到这里（PDF/DOCX 也可上传，系统会在你浏览器内脱敏，原文不上传服务器）"
              rows={8}
              aria-label="简历文本"
            />
            <div className="mt-2 flex items-center justify-between">
              <LengthHint value={text} min={MIN_LEN} />
              <Button
                variant="ghost"
                size="sm"
                icon="Upload"
                onClick={() => fileRef.current?.click()}
              >
                上传文件
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm text-muted">从业年限</span>
              <input
                type="number"
                min={0}
                max={45}
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="h-11 w-32 rounded-sm border border-border-strong px-3"
                aria-label="从业年限"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-muted">主要工作内容</span>
              <Textarea
                value={mainWork}
                onChange={(e) => setMainWork(e.target.value)}
                placeholder="例如：负责房建项目施工组织、进度与供应商管理"
                rows={4}
                aria-label="主要工作内容"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-muted">目标方向（不确定填「不知道」）</span>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-11 w-full rounded-sm border border-border-strong px-3"
                aria-label="目标方向"
              />
            </label>
          </div>
        )}

        <div className="mt-4">
          <Checkbox
            id="privacy"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            description="我已阅读并同意隐私政策：仅用于本次诊断，30 天自动清除，可随时删除。"
          >
            勾选即表示同意隐私政策（{POLICY_VERSION}）
          </Checkbox>
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
            <Icon name="CircleAlert" size="sm" />
            {error}
          </p>
        )}

        <div className="mt-4">
          <Button
            size="lg"
            fullWidth
            icon="Compass"
            loading={busy}
            loadingText="诊断中…"
            onClick={submit}
          >
            生成我的转型诊断
          </Button>
        </div>
      </Card>

      {busy && (
        <Card>
          <CardHeader icon="LoaderCircle" title="正在诊断" />
          <div className="h-2 w-full overflow-hidden rounded-xs bg-data-track">
            <div
              className="h-full rounded-xs bg-accent transition-[width] duration-base ease-standard"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted">{STAGE_TEXT[stage] ?? '处理中…'}</p>
        </Card>
      )}

      {result && resultId && (
        <div className="space-y-6">
          <ResultView
            payload={result.payload as DiagnosisPayload}
            modelDisclosure={result.model_disclosure}
            disclaimer={result.disclaimer}
          />
          <Card className="print-hidden">
            <CardHeader icon="Share2" title="下一步" />
            <div className="flex flex-wrap gap-3">
              <Button icon="FileText" onClick={() => (window.location.href = `/r/${resultId}`)}>
                查看完整报告
              </Button>
              <Button variant="secondary" icon="Link" onClick={doShare}>
                生成分享链接
              </Button>
              <Button variant="secondary" icon="Users" onClick={joinCommunity}>
                加入转型社群
              </Button>
            </div>
            {shareUrl && (
              <p className="mt-3 break-all text-sm text-meta">
                分享链接：{shareUrl}
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
