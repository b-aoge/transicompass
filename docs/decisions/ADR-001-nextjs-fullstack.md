# ADR-001: 采用 Next.js 16.2.12 App Router 作为全栈框架

- Status: Accepted (2026-08-03)
- Deciders: 高见远（架构师）
- Related: ADR-003, ADR-004, ADR-007

## Background

V1 是单页重交互 + 少量服务端接口（诊断、结果持久化、分享、留资、埋点）的工具型产品，没有独立 BFF 层需求。需要一套能同时承载前端渲染、API Route Handlers、SSE 流式响应，且部署简单、可回滚、有健康检查的方案。候选：Next.js 16 / NestJS + 独立前端 / Fastify + 独立前端。

## Decision

采用 **Next.js 16.2.12（App Router，React 19.2，TypeScript 5.9）** 作为全栈单体。前端用其 App Router 渲染，后端用 Route Handlers（`app/api/*/route.ts`）提供 REST + SSE。定时任务（30 天自动清除）用独立的轻量 Worker 进程或 `node-cron` 脚本，复用同一代码库与 Prisma 客户端。

## Consequences

- 正面：单一代码库、单一部署单元，部署与回滚简单；Route Handlers 原生支持 SSE；Vercel/Node 服务器均可托管。
- 负面：单体在高并发下前后端资源争用，但 MVP 量级（< 1 万 DAU）不构成压力；不满足未来多团队分库分表的扩展性，但 V1 不需要。

## Alternatives Considered

- NestJS + 独立前端：分层更重，MVP 阶段引入过多样板，部署单元翻倍。否决。
- Fastify + 独立前端：后端轻但需自建前端构建与托管链路，集成成本高于 Next.js 一体方案。否决。
