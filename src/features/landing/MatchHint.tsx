import { ScaleBar } from '@/ui/Progress';

/**
 * 桌面右列 sticky 区的"匹配度刻度条"示意，给访客一个真实产品形态的预期。
 * 数字 + 条长 + 文字档位三重编码（禁用单靠颜色）。
 */
export function MatchHint() {
  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <p className="label-caps">示例：匹配度刻度条</p>
      <p className="mt-2 text-sm text-fg-2">房建从业者 → 新能源储能</p>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="num text-lg font-announce leading-none text-data-1">78</span>
        <span className="text-xs text-meta">/ 100</span>
      </div>

      <ScaleBar value={78} rank={1} label="示例匹配度" showTicks className="mt-2" />

      <p className="mt-3 text-xs leading-body text-meta">
        真实诊断会给出三条赛道各自的匹配度，不靠单一颜色区分高低。
      </p>
    </div>
  );
}
