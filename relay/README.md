# Lead Relay

> 由 GPT 于 2026-05-01 创建。该服务是九章甄选 P0 的安全线索中转层。

## 为什么独立出来

主站当前使用 Next.js `output: "export"`，适合纯静态部署，但不能承载服务端 API。线索提交涉及飞书、企业微信、钉钉密钥，不能放在浏览器端，所以新增独立 Node relay：

- 前端提交统一 payload 到 `POST /api/leads`
- relay 校验数据、读取服务端环境变量
- relay 分发到飞书、企业微信、钉钉
- relay 提供账号密码 + 新设备验证码接口：`POST /api/auth/code`、`POST /api/auth/session`
- relay 预留微信支付接口：`POST /api/payments/wechat/prepay`，未完成签名实现前默认拒绝启用
- relay 提供管理员会话接口：`POST /api/admin/session`、`GET /api/admin/me`
- relay 提供 `GET /healthz` / `GET /readyz` 给部署平台做健康检查
- PostgreSQL/Redis 已接入本地模拟环境，但通过适配层解耦：`relay/db.mjs` 只负责 PostgreSQL 连接，`relay/redis.mjs` 只负责 Redis 状态，业务持久化集中在 `relay/database.mjs`，运行配置集中在 `relay/config.mjs`

## 本地 dry-run

```bash
cp .env.example .env.local
npm run db:init
LEAD_RELAY_DRY_RUN=true npm run relay:dev
```

另开一个终端：

```bash
curl -X POST http://127.0.0.1:8787/api/leads \
  -H 'Content-Type: application/json' \
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
- `LEAD_RELAY_SECRET` 使用强随机字符串，用于签发用户、管理员会话 token
- `LEAD_REQUIRE_CLIENT_SECRET=false` 适合浏览器表单提交；只有可信服务端调用方能保密 `X-Lead-Relay-Secret` 时才设为 `true`
- `DATABASE_URL` 和 `REDIS_URL` 只放服务端环境变量，不要提交真实密码到 Git
- 云端数据库通常由控制台先创建库和账号，保持 `DB_INIT_CREATE_DATABASE=false`，让 `npm run db:init` 只建表和导入种子数据
- 只有本地角色明确拥有建库权限时，才设置 `DB_INIT_CREATE_DATABASE=true`
- PostgreSQL/Redis 连接池、超时和重试只通过环境变量调整，不需要改业务代码
- `LEAD_RATE_LIMIT_MAX` 按部署环境限流能力调整，默认每 IP 每分钟 20 次
- `LEAD_REQUEST_TIMEOUT_MS` 控制单个外部渠道调用超时，默认 8000ms
- `LEAD_CHANNEL_RETRY_COUNT` 控制外部渠道失败重试次数，默认 1 次
- `LEAD_CHANNEL_RETRY_BASE_MS` 控制重试基础等待时间，默认 250ms
- 飞书、企微、钉钉密钥只放 relay 环境变量
- 上线前启用 `LEAD_CAPTCHA_REQUIRED=true`，并同时配置国内验证码服务的 `NEXT_PUBLIC_CAPTCHA_PROVIDER`、`CAPTCHA_PROVIDER` 与 `CAPTCHA_SECRET_KEY`
- 微信支付只允许服务端配置 `WECHAT_PAY_*`，不要把商户号、私钥、API v3 密钥放到 `NEXT_PUBLIC_*`
- 后台管理员必须配置 `ADMIN_BOOTSTRAP_EMAIL`、`ADMIN_BOOTSTRAP_PASSWORD`、`ADMIN_BOOTSTRAP_ROLE`，并定期轮换密码

## 稳定性机制

- **统一响应**：所有错误返回 `{ ok: false, error, message, requestId }`，便于前端展示和人工排查。
- **请求编号**：每次请求会返回 `X-Request-Id` 与 JSON `requestId`。
- **基础限流**：Redis 滑动窗口限流用于本地模拟与生产前验证；正式生产可再叠加云网关限流。
- **请求约束**：限制 JSON body 64KB，并要求 `Content-Type: application/json`。
- **防机器人**：按国内环境预留，优先接腾讯云验证码、阿里云验证码或极验。配置 `LEAD_CAPTCHA_REQUIRED=true` 后，线索和验证码接口都会先验证 token。
- **客户端密钥**：浏览器不能安全保存 relay 密钥；公开表单默认依赖 Origin 白名单、验证码和限流。服务端到服务端调用可开启 `LEAD_REQUIRE_CLIENT_SECRET=true`。
- **字段安全**：relay 会限制关键字段长度、去除控制字符，并校验手机号和来源 URL。
- **账号密码**：relay 用 scrypt 哈希保存密码，账号与信任设备已持久化到 PostgreSQL。
- **新设备验证**：注册必须输入验证码；登录先校验账号密码，若设备未信任，再要求短信或邮箱验证码。
- **动态验证码**：手机号/邮箱验证码优先存入 Redis，PostgreSQL 作为 fallback，含 TTL、单次使用和最大尝试次数；dry-run 才会返回 `devCode`。
- **渠道超时**：飞书、企微、钉钉单通道默认 8 秒超时，避免单个渠道拖垮整体提交。
- **渠道重试**：外部渠道失败会按配置进行短重试，降低偶发网络抖动影响。
- **优雅退出**：监听 `SIGINT` / `SIGTERM`，便于容器或进程管理器平滑停止。
- **数据库持久化**：`relay/database.mjs` 封装 PostgreSQL 操作，`relay/redis.mjs` 封装 Redis 限流与验证码状态；`npm run db:init` 可初始化本地 schema 与种子数据。

## 字段映射

飞书字段名按 `dev-brief.md` 表 C / 表 D：

- 企业需求：`company`、`contact_name`、`industry`、`pain_point`、`budget_range`、`expected_delivery`、`need_recommend`、`phone`、`wechat`、`context`、`created_at`
- 入驻申请：`team_name`、`direction`、`case_links`、`tech_stack`、`budget_range`、`can_invoice`、`contact_phone`、`contact_wechat`、`created_at`

如果飞书表字段使用中文列名，需要在 `relay/lead-relay.mjs` 的 `toFeishuFields()` 中调整映射。

## 账号与支付接口

### 账号密码与验证码

```bash
curl -X POST http://127.0.0.1:8787/api/auth/code \
  -H 'Content-Type: application/json' \
  -d '{"method":"phone","identifier":"13800138000","purpose":"login","role":"buyer"}'
```

注册或新设备登录时先发送验证码，然后调用 `/api/auth/session`：

```bash
curl -X POST http://127.0.0.1:8787/api/auth/session \
  -H 'Content-Type: application/json' \
  -d '{"method":"phone","identifier":"13800138000","purpose":"register","password":"StrongPass123","code":"123456","role":"buyer","deviceId":"dev_local_123456789"}'
```

`role` 是账号所属系统，`buyer` 为需求方，`provider` 为供给方。同一手机号或邮箱只能绑定一个系统；服务端会在验证码发送和会话建立时拒绝跨系统登录或重复注册，避免需求方/供给方数据混用。已信任设备再次登录只需要账号密码；新设备登录会返回 `requiresVerification: true`，前端再引导用户获取并输入验证码。dry-run 模式会返回 `devCode` 便于本地验证；生产环境不得开启 dry-run，也不会返回验证码明文。

### 微信支付

`POST /api/payments/wechat/prepay` 当前只做安全占位：如果未配置 `WECHAT_PAY_*` 返回 503；如果配置齐全但签名逻辑尚未完成，返回 501。这样可以避免前端误以为支付已可用。

## 管理员后台

```bash
curl -X POST http://127.0.0.1:8787/api/admin/session \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@jiuzhang.local","password":"AdminDemo123!"}'
```

管理员会话 token 由 relay 使用 HMAC 签名，默认 8 小时过期。bootstrap 管理员由 `npm run db:init` 写入 PostgreSQL；本地 dry-run 可使用演示密码，正式上线必须配置强 `ADMIN_BOOTSTRAP_PASSWORD`，后续再补多管理员管理、禁用账号和强制 MFA。
