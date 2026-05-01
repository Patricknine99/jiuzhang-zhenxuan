# Lead Relay

> 由 GPT 于 2026-05-01 创建。该服务是九章甄选 P0 的安全线索中转层。

## 为什么独立出来

主站当前使用 Next.js `output: "export"`，适合纯静态部署，但不能承载服务端 API。线索提交涉及飞书、企业微信、钉钉密钥，不能放在浏览器端，所以新增独立 Node relay：

- 前端提交统一 payload 到 `POST /api/leads`
- relay 校验数据、读取服务端环境变量
- relay 分发到飞书、企业微信、钉钉
- relay 提供 `GET /healthz` / `GET /readyz` 给部署平台做健康检查
- 数据库接口已保留在 `relay/database.mjs`，当前只返回 no-op 结果，不做持久化

## 本地 dry-run

```bash
cp .env.example .env.local
LEAD_RELAY_DRY_RUN=true npm run relay:dev
```

另开一个终端：

```bash
curl -X POST http://127.0.0.1:8787/api/leads \
  -H 'Content-Type: application/json' \
  -H 'X-Lead-Relay-Secret: change-me' \
  -d '{
    "type": "demand",
    "company": "测试公司",
    "contactName": "张三",
    "industry": "电商",
    "painPoint": "想用 AI 批量生成商品图",
    "budgetRange": "5千-2万",
    "expectedDelivery": "1-4周",
    "needRecommend": true,
    "phone": "13800000000",
    "wechat": "test-wechat"
  }'
```

## 生产配置

推荐部署到任一服务端环境：

- 国内云函数 / Serverless
- Node Docker 服务
- 自动化平台 Webhook 中转
- Vercel Function（仅早期海外链路验证）

生产环境建议：

- `LEAD_RELAY_DRY_RUN=false`
- `LEAD_ALLOWED_ORIGINS` 只填写正式域名
- `LEAD_RELAY_SECRET` 使用强随机字符串
- `LEAD_RATE_LIMIT_MAX` 按部署环境限流能力调整，默认每 IP 每分钟 20 次
- `LEAD_REQUEST_TIMEOUT_MS` 控制单个外部渠道调用超时，默认 8000ms
- `LEAD_CHANNEL_RETRY_COUNT` 控制外部渠道失败重试次数，默认 1 次
- `LEAD_CHANNEL_RETRY_BASE_MS` 控制重试基础等待时间，默认 250ms
- 飞书、企微、钉钉密钥只放 relay 环境变量

## 稳定性机制

- **统一响应**：所有错误返回 `{ ok: false, error, message, requestId }`，便于前端展示和人工排查。
- **请求编号**：每次请求会返回 `X-Request-Id` 与 JSON `requestId`。
- **基础限流**：内存级 IP 限流用于早期防刷；正式生产可叠加网关或云函数限流。
- **限流清理**：内存限流桶会定时清理，避免长时间运行后累积过多过期 IP。
- **请求约束**：限制 JSON body 64KB，并要求 `Content-Type: application/json`。
- **渠道超时**：飞书、企微、钉钉单通道默认 8 秒超时，避免单个渠道拖垮整体提交。
- **渠道重试**：外部渠道失败会按配置进行短重试，降低偶发网络抖动影响。
- **优雅退出**：监听 `SIGINT` / `SIGTERM`，便于容器或进程管理器平滑停止。
- **数据库占位**：`relay/database.mjs` 只保留接口，等数据库真实启用后在该文件内接入即可。

## 字段映射

飞书字段名按 `dev-brief.md` 表 C / 表 D：

- 企业需求：`company`、`contact_name`、`industry`、`pain_point`、`budget_range`、`expected_delivery`、`need_recommend`、`phone`、`wechat`、`context`、`created_at`
- 入驻申请：`team_name`、`direction`、`case_links`、`tech_stack`、`budget_range`、`can_invoice`、`contact_phone`、`contact_wechat`、`created_at`

如果飞书表字段使用中文列名，需要在 `relay/lead-relay.mjs` 的 `toFeishuFields()` 中调整映射。
