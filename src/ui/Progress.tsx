import { cn } from './cn';

function clamp(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

/**
 * Progress —— 确定性进度条（文件解析、上传）。
 *
 * 只用于「真实可测量」的进度。诊断等待过程严禁套假百分比：
 * 结果不准时，假进度会连带把可信度一起赔进去（设计系统 §10.2）。
 */
export function Progress({
  value,
  label,
  className,
}: {
  value: number;
  /** 可访问名，如「简历解析进度」 */
  label: string;
  className?: string;
}) {
  const pct = clamp(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('h-2 w-full overflow-hidden rounded-xs bg-data-track', className)}
    >
      <div
        className="h-full rounded-xs bg-accent transition-[width] duration-base ease-standard"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * ScaleBar —— 匹配度刻度条（本产品的标志性组件，水准仪读数隐喻）。
 *
 * 25/50/75 处的刻度线是刻意的：它把"78 分"从一个抽象数字变成一个可定位的读数。
 * 三重编码硬规则由调用方保证 —— 条长（本组件）+ 等宽数字 + 文字档位，
 * 三者缺一不可，绝不允许只靠颜色传达含义。禁止改成环形图。
 */
export function ScaleBar({
  value,
  rank = 1,
  label,
  showTicks = true,
  className,
}: {
  value: number;
  /** 排名决定同色系深浅，1 最深。禁止彩虹色板 */
  rank?: 1 | 2 | 3;
  label: string;
  showTicks?: boolean;
  className?: string;
}) {
  const pct = clamp(value);
  const fill =
    rank === 1 ? 'bg-data-1' : rank === 2 ? 'bg-data-2' : 'bg-data-3';

  return (
    <div className={className}>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="relative h-2 w-full overflow-hidden rounded-xs bg-data-track"
      >
        <div
          className={cn('h-full rounded-xs', fill)}
          style={{ width: `${pct}%` }}
        />
        {showTicks && (
          <>
            <span className="absolute inset-y-0 left-1/4 w-px bg-border-soft" />
            <span className="absolute inset-y-0 left-1/2 w-px bg-border-soft" />
            <span className="absolute inset-y-0 left-3/4 w-px bg-border-soft" />
          </>
        )}
      </div>
      {showTicks && (
        <div className="mt-1 flex justify-between text-xs text-meta">
          <span className="num">0</span>
          <span className="num">25</span>
          <span className="num">50</span>
          <span className="num">75</span>
          <span className="num">100</span>
        </div>
      )}
    </div>
  );
}

/**
 * 5 格方块强度刻度（可迁移能力强度）。
 * 取方块而非星星 —— 星星是消费级语言，方块是仪表语言。
 */
export function BlockScale({
  value,
  max = 5,
  label,
}: {
  value: number;
  max?: number;
  label: string;
}) {
  const filled = Math.min(max, Math.max(0, Math.round(value)));
  return (
    <span
      role="img"
      aria-label={`${label}：${max} 格中的 ${filled} 格`}
      className="inline-flex items-center gap-1"
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            'block h-3 w-3 rounded-xs',
            i < filled ? 'bg-data-1' : 'bg-data-track',
          )}
        />
      ))}
    </span>
  );
}
