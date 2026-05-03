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

浏览器表单不会携带 `LEAD_RELAY_SECRET`。该密钥只用于 relay 服务端签发用户/管理员 token；公开线索提交默认通过 `LEAD_ALLOWED_ORIGINS`、验证码与限流保护。若是可信服务端调用 relay，可设置 `LEAD_REQUIRE_CLIENT_SECRET=true` 并发送 `X-Lead-Relay-Secret`。

## 8. AI、账号与防机器人

由 ChatGPT 于 2026-05-01 补充：

- AI 需求诊断页：`/diagnosis`
- 诊断 AI 接口环境变量：`NEXT_PUBLIC_DIAGNOSIS_AI_URL`
- 悬浮客服 AI 接口环境变量：`NEXT_PUBLIC_SUPPORT_AI_URL`
- 当前账号页：`/login`、`/register`、`/account`
- 需求方工作台：`/buyers/dashboard`，配置 `NEXT_PUBLIC_LEAD_RELAY_URL` 且用户登录后，会调用 `GET /api/leads/mine?type=demand` 同步服务端线索；接口不可用时降级展示本地提交记录。
- 当前已做手机号/邮箱 + 密码的基础登录注册流程。注册时必须验证码；登录先校验账号密码，若是这台设备首次登录该账号，再要求短信或邮箱验证码。
- 未配置 `NEXT_PUBLIC_AUTH_RELAY_URL` 时仅用于静态演示，验证码固定为 `123456`；配置后会调用 relay 的 `/api/auth/code` 与 `/api/auth/session`，由服务端校验一次性验证码和设备信任状态。
- 防机器人按国内环境预留：前端配置 `NEXT_PUBLIC_CAPTCHA_PROVIDER` 后显示校验占位；relay 配置 `LEAD_CAPTCHA_REQUIRED=true`、`CAPTCHA_PROVIDER` 与 `CAPTCHA_SECRET_KEY` 后强制验证。候选优先考虑腾讯云验证码、阿里云验证码或极验，不加载境外验证码脚本。
- 微信、企业微信、飞书 OAuth 入口保留为禁用状态，等待真实开放平台应用信息后接入。

## 9. 微信支付预留

由 ChatGPT 于 2026-05-02 补充：

- 微信支付只在 relay 服务端预留 `/api/payments/wechat/prepay`。
- 未配置 `WECHAT_PAY_*` 时返回 503，配置齐全但签名实现未完成时返回 501，避免出现“前端可点但支付链路不可用”的误导。
- 生产环境需要补齐微信支付商户证书签名、回调验签、订单幂等、金额服务端计算、支付状态查询和退款权限控制。

## 10. 管理员后台

由 ChatGPT 于 2026-05-02 补充：

- 后台页面：`/admin`
- 前端管理员 relay：`NEXT_PUBLIC_ADMIN_RELAY_URL`
- relay 接口：`POST /api/admin/session`、`GET /api/admin/me`
- 管理员配置：`ADMIN_BOOTSTRAP_EMAIL`、`ADMIN_BOOTSTRAP_PASSWORD`、`ADMIN_BOOTSTRAP_NAME`、`ADMIN_BOOTSTRAP_ROLE`、`ADMIN_SESSION_TTL_MS`
- 角色模型：超级管理员、运营管理员、客服坐席、财务审核、审计只读。
- 权限模型：查看线索、分配跟进、审核服务商、编辑内容、查看支付、系统设置、查看审计。
- 当前后台包含线索处理队列、权限矩阵、今日运营清单、审计预览、支付权限提示；真实数据库接入后可把本地最近提交替换为服务端线索表。

## 11. 灰度与生产检查

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
