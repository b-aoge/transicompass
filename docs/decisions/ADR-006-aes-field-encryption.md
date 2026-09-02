# ADR-006: 应用层字段级 AES-256-GCM 加密，不用 pgcrypto / TDE

- Status: Accepted (2026-08-03)
- Deciders: 高见远（架构师）
- Related: ADR-003

## Background

诊断结果含脱敏后的经历文本、留资线索含手机/邮箱等。需在存储层保护这些数据，同时满足"30 天自动清除 + 用户即时删除"。加密需与具体数据库引擎解耦，便于未来迁移，且密钥可独立轮换。

## Decision

采用**应用层字段级 AES-256-GCM** 加密（Node `crypto`，密钥存环境变量/密钥管理，按字段 nonce）。明文不出应用进程即加密，再写入 Postgres。不依赖 `pgcrypto`（绑定 PG）也不依赖 TDE（引擎级、备份仍密文但运维复杂）。加密字段：诊断原文、留资手机/邮箱。删除时物理 `DELETE` 行 + 密文随之消失。

## Consequences

- 正面：与数据库引擎解耦，便于迁移；密钥可独立轮换；字段级粒度，非敏感字段不加密不影响查询。
- 负面：加密字段不可被数据库直接索引/检索，留资查询需用哈希盐值或单独明文索引列（脱敏后）；应用层需保证 nonce 唯一。

## Alternatives Considered

- pgcrypto：绑定 PostgreSQL，迁移成本高。否决。
- TDE：引擎级透明加密，运维与备份管理复杂，MVP 过度。否决。
