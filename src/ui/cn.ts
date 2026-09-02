/**
 * 极简 className 合并。
 * 刻意不引入 clsx / tailwind-merge：本项目组件的样式冲突靠「变体表穷举」解决，
 * 而不是靠运行时字符串裁剪；少两个依赖也少两条供应链风险。
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  let out = '';
  for (const v of values) {
    if (!v) continue;
    out = out ? `${out} ${v}` : v;
  }
  return out;
}
