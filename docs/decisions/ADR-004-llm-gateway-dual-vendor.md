# ADR-004: LLM 采用境内已备案模型双供应商 + 自建 Gateway

- Status: Accepted (2026-08-03)
- Deciders: 高见远（架构师）
- Related: ADR-005, ADR-009

## Background

产品依赖大模型做能力抽取与赛道匹配。监管要求：仅 API 调用第三方已备案模型无需"大模型备案"，但需"算法备案 + 生成式人工智能服务登记"并公示编号；境外模型直连存在数据出境与备案不确定风险。需保证可用性（单供应商故障可降级）与输出稳定性（结构化 JSON、`temperature≈0.1`）。

## Decision

采用**境内已备案模型双供应商**：主供应商阿里云百炼 DashScope（通义 `qwen3.7-plus` / `qwen-flash`，OpenAI 兼容协议），备供应商 DeepSeek（`deepseek-v4-pro`）。自建轻量 LLM Gateway 统一封装：模型路由、失败切换、超时、结构化输出校验、prompt 注入过滤。合规前置排除所有境外模型直连。

## Consequences

- 正面：满足境内合规（已备案模型 + 算法备案/生成式登记）；双供应商保障可用性；Gateway 抽象让前端不感知模型差异。
- 负面：需维护切换逻辑与两套供应商 SDK/凭证；备供应商输出格式需同样过 Zod 闸门。

## Alternatives Considered

- 单供应商：可用性无兜底，故障即白屏。否决。
- 境外模型直连（GPT/Claude）：数据出境合规风险，且需大模型备案，V1 不可行。否决。
