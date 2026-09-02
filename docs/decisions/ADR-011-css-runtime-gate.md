# ADR-011: CSS 运行期特性兼容闸门（lint 强制，呼应 ADR-002 Chrome 88 下限）

- Status: Accepted (2026-08-03)
- Deciders: 高见远（架构师），协同 designer
- Related: ADR-002

## Background

ADR-002 将运行期兼容下限设为 Chromium 88 级内核（覆盖二三线存量 Android 机的微信 XWeb）。在该下限之上引入的 CSS 特性，在老内核上会**整条声明被丢弃**，导致布局塌缩。designer 一度在还原提示词里写 `height:100dvh`（需 Chrome 108+），后被发现：老内核不识别 `dvh` → 高度声明失效 → 全屏容器塌陷。等于在架构侧规避掉的风险又被设计侧放回来了。

此类坑不止 `dvh` 一个：`color-mix()`（111+）、`:has()`（105+）、`@container`（105+）、`oklch()`（111+）均超出兼容下限。手写 CSS 极易顺手引入，且文档约定约束力弱。

## Decision

建立**运行期禁用 CSS 特性清单**作为硬约束（见 Spec §8.6）：
- 禁用：`color-mix()`、`:has()`、`@container`、`oklch()` 等 Chrome 105+/111+ 特性。
- 限用：`dvh`/`svh`/`lvh` 必须带 `vh` 回退（层叠写法 `min-height:100vh; min-height:100dvh;`）；禁止裸写 `height:100dvh`。

**强制执行方式优先级**：
1. **stylelint**（`stylelint-config-standard` + 自定义禁用插件）在 pre-commit / CI 拦截——比写进文档更可靠，是主防线。
2. §12 T8 的 8.9 静态扫描作兜底（grep 禁用特性 + dvh 文件级 vh 回退校验）。
3. 设计令牌文件（tokens.css / globals.css 的 `:root`）允许写死 hex（C2 例外），但不得使用上述禁用函数生成色值；designer 已审计其 tokens.css 对 5 项零使用。

## Consequences

- 正面：把 ADR-002 的兼容下限从"文档声明"升级为"工具强制"，杜绝运行期静默塌缩；前端无法顺手引入超限特性。
- 负面：开发者写 CSS 时多一层 lint 约束（如确需 `:has()` 需申请白名单），MVP 阶段可接受。

## Alternatives Considered

- 仅文档约定：约束力弱，designer 已自证会踩坑。否决。
- 等 CI 报错再修：运行期问题真机才暴露，修复成本高。否决，改为主动 lint 拦截。
