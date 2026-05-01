# 线索集成接口说明

> 由 GPT 于 2026-05-01 创建。本文档用于后续接入飞书、企业微信、钉钉，不在前端暴露任何密钥。

## 1. 总体原则

- 前端只提交统一的 `LeadPayload`，不关心具体写入哪个系统。
- 密钥只放在安全中转层：Serverless Function、国内云函数、自动化平台 Webhook 或自有后端。
- 一个线索可以同时分发多个渠道：飞书用于结构化入库，企业微信/钉钉用于即时通知。
- 当前项目是 `output: "export"` 的纯静态站，不能直接包含 Next API Route；正式接入时应部署独立安全中转。

## 2. 统一数据结构

代码位置：`lib/integrations.ts`

- `DemandLead`：企业发布需求。
- `ApplicationLead`：服务商入驻申请。
- `LeadChannel`：`feishu` / `wecom` / `dingtalk`。
- `toNotificationText()`：将统一线索转成企微/钉钉机器人可读文本。

## 3. 建议环境变量

```bash
LEAD_CHANNELS=feishu,wecom,dingtalk

FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_APP_TOKEN=
FEISHU_DEMAND_TABLE_ID=
FEISHU_APPLICATION_TABLE_ID=

WECOM_BOT_WEBHOOK_URL=
WECOM_MENTIONED_MOBILE_LIST=

DINGTALK_BOT_WEBHOOK_URL=
DINGTALK_BOT_SECRET=
DINGTALK_AT_MOBILES=
```

## 4. 渠道映射

### 飞书

- 企业需求写入需求线索表。
- 入驻申请写入服务商申请表。
- 字段映射以 `dev-brief.md` 的表 C / 表 D 为准。
- 如果需求来自服务商、案例、服务类型或行业二级页，前端会额外带入 `context` 字段，便于人工跟进时识别入口。

### 企业微信

- 推荐先接群机器人 Webhook，收到线索后推送纯文本摘要。
- 后续可升级为客户联系、客户群、CRM 工作流。

### 钉钉

- 推荐先接群机器人 Webhook。
- 若启用加签，签名应在安全中转层计算，不能放在浏览器端。

## 5. 后续接入顺序

1. 确认最终使用的渠道和目标群/表。
2. 在安全中转层读取环境变量。
3. 前端表单提交到安全中转。
4. 中转层调用 `submitLeadToChannels()` 的真实实现。
5. 成功后返回统一结果，前端进入成功页。

## 6. 当前实现

- 独立 relay：`relay/lead-relay.mjs`
- 数据库占位接口：`relay/database.mjs`
- 使用说明：`relay/README.md`
- 环境变量模板：`.env.example`
- 前端提交组件：`components/shared/StaticForm.tsx`

当前主站未配置 `NEXT_PUBLIC_LEAD_RELAY_URL` 时，表单会以静态 Demo 模式直接进入成功页；配置后会向 relay 发送真实请求。

## 8. AI 与账号接口预留

由 ChatGPT 于 2026-05-01 补充：

- AI 需求诊断页：`/diagnosis`
- 诊断 AI 接口环境变量：`NEXT_PUBLIC_DIAGNOSIS_AI_URL`
- 悬浮客服 AI 接口环境变量：`NEXT_PUBLIC_SUPPORT_AI_URL`
- 当前账号页：`/login`、`/register`、`/account`
- 当前已做手机号/邮箱前端注册登录流程，真实短信、邮箱登录、微信、企业微信、飞书 OAuth 仍需后端用户系统支持。

## 9. 灰度与生产检查

由 ChatGPT 于 2026-05-02 补充：

- 系统状态页：`/status`
- 数据一致性检查：`npm run verify:data`
- 路由 smoke test：`npm run smoke:routes`
- 生产环境变量检查：`npm run check:env`
- relay 已增加外部渠道短重试与限流桶清理，降低偶发网络拥堵影响。

## 7. 后端稳定性补充

由 ChatGPT 于 2026-05-01 补充：

- `GET /healthz` / `GET /readyz` 可用于部署健康检查。
- relay 会返回 `requestId`，前端可展示请求编号，便于人工排障。
- relay 已加入 JSON Content-Type 校验、64KB body 限制、内存级 IP 限流和渠道请求超时。
- 数据库接口暂时保持空实现，当前不引入真实数据库；后续只需在 `relay/database.mjs` 内补充写入逻辑。
