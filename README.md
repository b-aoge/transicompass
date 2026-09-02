# 转型罗盘 TranSiCompass

> 工程人转型决策工具 · 4 步 AI 定位诊断（自我描述 → AI 定位诊断 → 简历优化 → 学习路径）

转型罗盘是一个面向**工程/基建从业者**的转型决策产品：用一份自我描述或简历，由 AI 给出可执行的转型方向、岗位匹配、简历优化建议与学习路径，并直接联动真实在招岗位（猎聘 / 智联 / BOSS 直聘）。

---

## 项目状态

| 版本 | 路径 | 状态 | 说明 |
| --- | --- | --- | --- |
| **单文件版（主版本）** | `app/transicompass.html` | ✅ 活跃迭代 | 零后端依赖，浏览器直连 DeepSeek，部署到 CloudStudio 静态托管 |
| **Next.js 全栈版** | `src/`、`prisma/`、`openapi.yaml` | 🧊 已冻结 | 历史版本，曾部署 CloudBase；含 PostgreSQL / Redis / 双厂商 LLM 网关 |

> 当前线上唯一入口：`https://83c2c54cd34241949c0ac0f1df07d24d.app.workbuddy.link/`（v1.17）
> 所有迭代改 `app/transicompass.html`；部署前复制为 `dist/index.html`。

---

## 目录结构

```
转型罗盘TranSiCompass/
├── app/
│   └── transicompass.html      # 主产品（单文件 HTML，内联 CSS/JS，浏览器直连 DeepSeek）
├── dist/
│   ├── index.html              # 构建/部署副本（由 app/ 复制， gitignore）
│   └── jobs_data.json          # 真实岗位数据（6 方向 × 10 条，已入库）
├── docs/
│   ├── PRD.md                  # 产品需求文档
│   ├── design.md               # 设计说明
│   ├── Spec_TranSiCompass_V1.md
│   ├── 产品规划文档_TranSiCompass_V1.md
│   ├── 设计系统_TranSiCompass_V1.md
│   ├── BOSS直聘_RPA抓取原理.md
│   └── decisions/              # ADR 架构决策记录（001–011）
├── src/                        # Next.js 全栈版源码（已冻结）
├── prisma/                     # 数据库 schema / 迁移（已冻结）
├── scripts/                    # 校验 / 快照脚本
├── openapi.yaml                # API 定义（已冻结）
├── design-tokens.json          # 设计令牌
├── .env.example                # 环境变量样例（真实密钥请填 .env，绝不入库）
├── Dockerfile / cloudbaserc.json
└── README.md
```

---

## 快速开始（单文件版）

1. 用浏览器打开 `app/transicompass.html`（直接双击即可，无需构建）。
2. 在页面「API Key」输入框填入你自己的 **DeepSeek API Key**（形如 `sk-...`）。
   - 不填也能试用：AI 改写失败时自动回退本地 STAR 模板，页面不会崩。
3. 按 4 步流程填写自我描述 / 上传简历，获取诊断与岗位推荐。

> 说明：仓库中的 `app/transicompass.html` **不含任何硬编码密钥**（默认 Key 已置空）。
> 线上演示版由部署方单独配置演示 Key，请使用自己的 Key 以获得不限次数调用。

---

## Next.js 全栈版（历史 / 冻结，仅供阅读）

需要本地环境：Node ≥ 22.12、PostgreSQL 17、Redis 7.4（可选，留空自动降级为内存计数）。

```bash
cp .env.example .env      # 填写 DATABASE_URL / DASHSCOPE_API_KEY / DEEPSEEK_API_KEY 等
npm install
npx prisma migrate deploy
npm run dev               # http://localhost:3000
```

`LLM_FORCE_MOCK=true` 时可在不配置任何 Key 的情况下用确定性 mock 跑通端到端流程（输出随输入变化，非写死）。

---

## 岗位数据

- 数据文件：`dist/jobs_data.json`（6 个转型方向 × 10 条真实在招岗位，来源猎聘 / 智联，WebFetch 免登录采集）。
- 前端按方向精确→包含→关键词兜底匹配；BOSS 直聘以关键词跳转方式呈现（需登录，未直接抓数）。
- 刷新方式：重新 WebFetch 抓取 → 更新 `jobs_data.json` → 重新部署。

---

## 架构要点（详见 `docs/decisions/`）

- 浏览器直连 DeepSeek（CORS 已验证），无需代理。
- 双厂商 LLM 网关（阿里云百炼 主 / DeepSeek 备），主备均空时走 mock。
- 客户端 PII 脱敏 + 字段级 AES 加密 + 限流（见 ADR-003 / 006 / 007）。
- 确定性回退：任何 AI 失败都不让页面崩溃。

---

## 安全须知

- **绝不向仓库提交真实密钥**：`.env`、`.env.local` 已被 gitignore；`.env.example` 仅含 key 名称。
- 仓库已排除 `_backups/`（本地快照）、`.workbuddy/`（内部记忆）、`docs/snapshots/`（含历史硬编码 Key 的页面存档）。
- 如你 Fork / 部署本仓库，请使用**自己的** API Key，并遵守对应服务商的用量与合规要求。

---

## 许可证

暂未声明许可证。如需开源，请自行添加 `LICENSE` 文件（如 MIT）。
