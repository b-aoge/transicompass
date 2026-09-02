import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { PREVIEW_SAMPLE } from './constants';

/**
 * 翻译对照预览卡 —— 替代千篇一律 Hero 的关键证据件。
 * 上半 surface-sunken（原文），下半 surface + ring（改写后），中间 arrow-down。
 * 移动端内联在表单前，桌面端放进右列 sticky 区（见 app/page.tsx）。
 */
export function TranslationPreviewCard() {
  const s = PREVIEW_SAMPLE;
  return (
    <Card flush className="overflow-hidden">
      <div className="bg-surface-sunken px-5 py-4 md:px-6">
        <p className="label-caps">{s.beforeLabel}</p>
        <p className="mt-2 text-base leading-body text-fg-2">{s.before}</p>
      </div>

      <div className="flex justify-center bg-surface py-1 text-muted" aria-hidden="true">
        <Icon name="ArrowDown" size="md" />
      </div>

      <div className="bg-surface px-5 py-4 md:px-6">
        <p className="label-caps text-accent">{s.afterLabel}</p>
        <p className="mt-2 text-base leading-body text-fg">{s.after}</p>
      </div>

      <p className="border-t border-border-soft px-5 py-3 text-xs text-meta md:px-6">
        {s.footnote}
      </p>
    </Card>
  );
}
