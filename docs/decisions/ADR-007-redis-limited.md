# ADR-007: Redis 仅用于验证码与限流，可降级为 Postgres UNLOGGED

- Status: Accepted (2026-08-03)
- Deciders: 高见远（架构师）
- Related: ADR-001

## Background

MVP 需要手机验证码存储与接口限流滑动窗口。这两者都是短 TTL、高写入量的键值场景。但是否值得为 MVP 引入独立 Redis 实例，需要在成本与运维复杂度间权衡。

## Decision

默认引入 **Redis 7.4** 仅做两件事：验证码短时存储（TTL 5min）、`/diagnosis` 与 `/lead` 的限流滑动窗口。明确**不做缓存层**（MVP 无缓存需求，加了只增加一致性 bug 面）。成本敏感或部署受限时，可用 Postgres `UNLOGGED TABLE` + 索引替代，ADR 记录此降级开关。

## Consequences

- 正面：验证码/限流场景契合 Redis 特性；限流逻辑简单；降级开关保证部署弹性。
- 负面：多一个基础设施组件与运维点；若降级到 PG UNLOGGED，限流精度略降但 MVP 可接受。

## Alternatives Considered

- 纯 Postgres 实现限流：可行但高并发写入压力与 TTL 清理需自建，MVP 阶段不如 Redis 省心。作为降级保留。
