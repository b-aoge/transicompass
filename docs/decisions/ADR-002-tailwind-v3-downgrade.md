# ADR-002: 降级选用 Tailwind CSS 3.4.19（而非 4.3.3）

- Status: Accepted (2026-08-03)
- Deciders: 高见远（架构师）
- Related: ADR-008

## Background

目标用户为 28–40 岁工程中坚，设备分布明显落后于主流，且需兼容微信内置浏览器（XWeb / X5 内核，部分机型 Chrome 内核版本 < 100）。Tailwind v4（4.3.3）要求构建期 Chrome 111+ 且运行期依赖较新 CSS 特性，在老旧内核上有样式塌缩风险。Vite/Next 原生对 v4 的 Oxide 引擎也存在兼容摩擦。

## Decision

采用 **Tailwind CSS 3.4.19**（PostCSS 插件模式，Jit 编译）。背离"用最新版"的默认倾向，刻意保留 v3 以换取运行期兼容确定性。所有颜色值通过设计令牌（见 `tokens.css` 的 `var(--token)`）注入，不在组件内写死 hex。

## Consequences

- 正面：运行期兼容覆盖面更广，覆盖微信内置浏览器与中低端安卓；构建稳定，踩坑少。
- 负面：构建速度略慢于 v4 的 Oxide 引擎；未来若升级需重写部分配置文件（content 字段、插件写法）。这是可接受的 MVP 期权衡。

## Alternatives Considered

- Tailwind 4.3.3：构建更快但运行期兼容风险高，对目标人群设备不可接受。否决。
