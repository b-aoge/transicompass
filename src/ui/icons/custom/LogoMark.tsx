import type { LucideProps } from 'lucide-react';

/**
 * 品牌 Logo Mark —— 方形取景框内一枚指北针。
 * 外框呼应施工图纸标题栏，内针呼应罗盘（设计系统 §4「品牌 Logo Mark」）。
 *
 * 按 Spec R3 的要求：24×24 网格、1.5px 描边、与 Lucide 同构，
 * 走 registry 登记后经 Icon.tsx 统一出口消费，业务组件不直接 import。
 * 只有「框 + 三角针」两个形状，保证 16px 下不糊。
 */
export function LogoMark({
  size = 24,
  strokeWidth = 1.5,
  ...rest
}: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 6.5 15.2 15 12 13.2 8.8 15Z" />
    </svg>
  );
}
