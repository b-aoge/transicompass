# ADR-008: 锁定 Lucide 为唯一图标库

- Status: Accepted (2026-08-03)
- Deciders: 高见远（架构师）
- Related: ADR-002

## Background

P0 绝对规则要求：禁止 emoji 作为功能图标，全项目统一一套 SVG 图标库，尺寸 16/20/24px。混用多套图标库会导致描边粗细、视觉权重不一致，破坏"刻度化中性"的设计语言。

## Decision

锁定 **`lucide-react` 1.26.0** 为唯一图标来源。所有图标经唯一出口 `src/ui/Icon.tsx` 封装，统一注入 `size`（16/20/24）与 `strokeWidth`（2/1.75/1.5）。禁止在组件内直接 `import` 其他图标库或写 inline SVG 图标。设计令牌文件 `tokens.css` 中 currentColor 驱动描边色，跟随 `--fg` 层级。

## Consequences

- 正面：全站图标视觉一致；单一依赖便于 tree-shaking；尺寸/描边受控，符合中性刻度语言。
- 负面：Lucide 不含个别极特殊业务图标时，需增补为同一描边风格的自定义 SVG（仍经 Icon 出口），不允许引入第二库。

## Alternatives Considered

- Heroicons / Tabler：风格可用，但选定 Lucide 后混用即违规，故只取其一并锁定。
