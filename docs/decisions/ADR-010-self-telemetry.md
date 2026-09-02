# ADR-010: 自建轻量埋点，不接第三方 SDK

- Status: Accepted (2026-08-03)
- Deciders: 高见远（架构师）
- Related: ADR-003

## Background

需采集诊断完成、CTA 点击、分享、删除等转化漏斗事件，用于判断"是否达付费触发条件"。但第三方埋点 SDK（如境外分析工具）存在数据出境合规风险与隐私采集过度问题；且 MVP 事件量小，自建成本极低。

## Decision

自建轻量埋点：前端 `POST /events` 上报，事件名 `{对象}_{动作}`（如 `diagnosis_completed`、`cta_clicked`），附 `session_id`（非实名 UUID）、`timestamp`、`device`、`version`。**不采集**简历原文、**不采集** IP、不绑定实名。服务端仅落库聚合用事实表。不引入任何第三方分析 SDK。

## Consequences

- 正面：数据完全自持、合规清晰；无第三方依赖与脚本加载开销；事件 schema 可控。
- 负面：需自建看板/聚合查询，MVP 阶段用简单 SQL 即可满足；无现成漏斗分析工具。

## Alternatives Considered

- 第三方分析 SDK（GA / 境外产品）：数据出境与隐私合规风险，且 MVP 过度。否决。
