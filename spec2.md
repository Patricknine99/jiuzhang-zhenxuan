# 九章甄选 — P0 开发执行记录

> 创建时间：2026-05-01  
> 执行者：GPT  
> 记录规则：本文件记录从“后端 / API 中转 P0”开始的每一步进度、状态、改动范围和验证结果。

---

## 0. 当前状态确认

- **后端是否已做**：未完成。此前版本是纯静态 Next.js 站点，没有后端服务。
- **API 请求中转是否已接入**：未完成。此前只预留了 `lib/integrations.ts` 类型契约、静态表单和成功页，没有真实 API 请求。
- **当前 P0 目标**：实现安全线索中转最小可用版，支持飞书、企业微信、钉钉三类渠道。

---

## 1. P0 任务清单与优先级

### P0-1：安全中转服务骨架

- **状态**：已完成
- **目标**：新增独立 Node relay 服务，提供 `POST /api/leads`，避免浏览器端暴露飞书、企业微信、钉钉密钥。
- **备注**：主站继续保持 `output: "export"` 纯静态；relay 可独立部署。
- **完成记录**：新增 `relay/lead-relay.mjs`，使用 Node 原生 `http` 和 `fetch`，提供 `POST /api/leads`、CORS、可选共享密钥、请求体大小限制、payload 校验和 dry-run 模式。

### P0-2：三渠道适配器

- **状态**：已完成
- **目标**：实现飞书多维表格写入、企业微信群机器人通知、钉钉群机器人通知。
- **完成记录**：`relay/lead-relay.mjs` 已实现飞书 tenant token + bitable record 写入、企业微信机器人文本通知、钉钉机器人文本通知和加签。

### P0-3：前端表单接入中转

- **状态**：已完成
- **目标**：发布需求、服务商入驻表单提交统一 payload 到 relay；未配置 relay 时保留静态降级。
- **完成记录**：更新 `components/shared/StaticForm.tsx`，根据 `leadType` 组装 `DemandLead` / `ApplicationLead`。若配置 `NEXT_PUBLIC_LEAD_RELAY_URL`，前端会 `POST` 到 relay；未配置时继续直接跳转成功页，适合纯静态演示。

### P0-4：配置与文档

- **状态**：已完成
- **目标**：补充 `.env.example`、relay 使用说明、安全注意事项。
- **完成记录**：新增 `.env.example` 与 `relay/README.md`，补充本地 dry-run、生产配置、安全注意事项、字段映射；同步更新 `docs/integrations.md` 当前实现位置。

### P0-5：验证

- **状态**：已完成
- **目标**：运行 lint/build、relay 语法检查、关键路由验证，并记录结果。
- **完成记录**：
  1. `npm run relay:check` 通过。
  2. `npm run lint` 通过。
  3. `npm run build` 通过，静态生成 20 个页面。
  4. 使用 `LEAD_RELAY_DRY_RUN=true` 启动 relay，在 `feishu,wecom,dingtalk` 三渠道配置下分别提交企业需求与入驻申请测试 payload，均返回 `ok: true`。
  5. 验证结束后已停止本地 relay 测试进程。

---

## 2. P0 完成状态

- **状态**：已完成
- **完成时间**：2026-05-01
- **结果**：后端安全中转最小可用版已经完成。前端可通过 `NEXT_PUBLIC_LEAD_RELAY_URL` 接入 relay；relay 可通过环境变量分发到飞书、企业微信、钉钉。
- **未接真实外部服务原因**：当前没有提供飞书应用密钥、飞书多维表格 ID、企业微信机器人地址、钉钉机器人地址。代码已支持，填入环境变量即可联调。

## 3. 下一批建议任务

1. **P1：真实渠道联调**  
   填入飞书、企业微信、钉钉测试环境变量，分别验证真实写入和通知。
2. **P1：表单成功页展示提交结果**  
   当前成功页不展示各渠道结果；后续可把 relay 返回结果存入 sessionStorage 后展示。
3. **P1：反滥用增强**  
   增加 Turnstile/验证码、IP 限流或云函数网关限流。
4. **P2：飞书字段中文列名适配**  
   如果实际飞书表使用中文字段名，需要调整 `toFeishuFields()` 映射。

---

## 4. ChatGPT 自动优先级（2026-05-01）

1. **P0：后端稳定性兜底**  
   先保证线索中转服务不会因异常请求、外部渠道卡顿或重复提交影响整体可用性。
2. **P0：数据库接口占位**  
   按要求暂不启用真实数据库，但保留明确接入点，后续填入持久化逻辑即可。
3. **P0：前端提交体验与错误可追踪**  
   表单提交需有超时、错误提示、请求编号和本地提交记录，避免用户提交后无反馈。
4. **P1：文档与 SPEC 同步**  
   每次由 ChatGPT 进行的修改都记录到 SPEC，方便后续继续在本窗口开发。
5. **P1：真实渠道联调**  
   等飞书、企业微信、钉钉真实环境变量准备好后再进行外部链路验证。

## 5. ChatGPT 修改记录（2026-05-01 后端稳定性批次）

- **执行者**：ChatGPT
- **状态**：已完成并通过验证
- **改动范围**：
  1. 新增 `relay/database.mjs`，作为数据库持久化预留接口；当前只返回 no-op 结果，不连接真实数据库。
  2. 更新 `relay/lead-relay.mjs`，新增 `/healthz`、`/readyz`、请求编号、统一错误响应、JSON Content-Type 校验、IP 内存限流、渠道超时、空渠道保护和优雅退出。
  3. 更新 `components/shared/StaticForm.tsx`，新增前端提交超时、relay 响应解析、请求编号展示、sessionStorage 最近提交记录、需求表单联系方式校验、入驻方向校验。
  4. 更新 `app/page.tsx`，在首页加入后端中转稳定性说明模块。
  5. 更新 `app/post-demand/page.tsx` 与 `app/globals.css`，补充联系方式提示与表单状态样式。
  6. 更新 `.env.example`、`relay/README.md`、`docs/integrations.md`，补充稳定性配置和数据库占位说明。
- **验证结果**：
  1. `npm run relay:check` 通过。
  2. `npm run lint` 通过。
  3. `npm run build` 通过，静态生成 20 个页面。
  4. dry-run 启动 relay 后，`GET /healthz` 返回 `ok: true`、`database: "reserved"`、三渠道列表和 `requestId`。
  5. dry-run 提交企业需求到 `POST /api/leads` 返回 `ok: true`，结果包含 database 占位、feishu、wecom、dingtalk 四项。
  6. 验证结束后已通过 `SIGINT` 停止本地 relay，优雅退出日志正常输出。

## 6. Git 保存规则（2026-05-01）

- **执行者**：ChatGPT
- **规则**：后续每次重大改动完成后，ChatGPT 需要：
  1. 在 SPEC 文件中备注改动范围、执行者、验证结果。
  2. 使用 Git 提交保存一个可回滚点。
  3. 提交信息使用清晰中文或英文，说明本次主要变更。
- **本次动作**：准备初始化 Git 仓库，新增 `.gitignore` 排除依赖、构建产物、本地环境和工作区元数据，然后提交当前稳定性批次。

## 7. ChatGPT 验证记录（2026-05-01 路由与响应批次）

- **执行者**：ChatGPT
- **状态**：已完成并通过验证
- **验证范围**：
  1. Git 状态、分支和最近提交。
  2. `npm run relay:check`、`npm run lint`、`npm run build`。
  3. 本地 Next dev 服务下的核心页面 HTTP 响应。
  4. relay dry-run 下的健康检查、正常提交、鉴权错误、Content-Type 错误。
- **发现的问题**：
  1. `.next/dev/lock` 残留导致 `npm run dev` 误判已有服务；确认 PID 不存在后清理缓存 lock 并重新启动。
  2. 在 `output: "export"` 下访问不存在的 `/providers/:slug`、`/cases/:slug` 虽然返回 404，但 Next dev 日志会记录动态参数错误。
- **ChatGPT 修改**：
  1. 在 `app/providers/[slug]/page.tsx` 增加 `export const dynamicParams = false`。
  2. 在 `app/cases/[slug]/page.tsx` 增加 `export const dynamicParams = false`。
- **原因**：明确动态详情页只允许 `generateStaticParams()` 生成的 slug，未知 slug 直接静态 404，避免开发日志出现误导性的动态参数错误。
- **验证结果**：
  1. `npm run relay:check` 通过。
  2. `npm run lint` 通过。
  3. `npm run build` 通过，静态生成 20 个页面。
  4. 本地 Next dev 核心路由响应正常：`/`、`/providers`、`/providers/spark-ai-automation`、`/cases`、`/cases/b2b-consulting-rag-system`、`/post-demand`、`/join`、`/sla`、`/terms`、`/privacy`、`/provider-agreement` 均返回 200。
  5. 未知动态路由 `/providers/bad-slug` 与 `/cases/bad-slug` 最终均返回 404。说明：Next dev 在 `output: "export"` 模式下访问未导出的动态路径时仍可能记录一条静态参数诊断，但生产静态构建不受影响。
  6. relay dry-run 验证通过：`GET /healthz` 返回健康状态；`POST /api/leads` 正常需求 payload 返回 `ok: true`；错误密钥返回 401；错误 Content-Type 返回 415。
  7. 数据一致性脚本通过：4 个服务商、3 个案例，slug 无重复，案例引用的服务商均存在。
  8. 表单页面检查通过：`/post-demand`、`/join` 均包含字段、提交按钮和安全中转说明。
  9. 页面 HTML 中未发现真实运行时错误；`error` 字符串命中来自 Next dev 自动注入的 global-error 脚本与样式。

## 8. ChatGPT 修改记录（2026-05-01 二级菜单与 P0/P1/P2 可执行批次）

- **执行者**：ChatGPT
- **状态**：已完成并通过验证
- **用户反馈**：预览网页里的按钮没有二级菜单，也缺少明确的二级页面承接。
- **优先级处理**：
  1. **P0 已做**：新增导航二级下拉菜单；新增服务类型和行业二级落地页；服务商/案例/服务类型/行业入口跳转发布需求时带入上下文；relay 接收并分发 `context` 字段。
  2. **P1 已做**：成功页读取最近一次提交记录并展示请求编号与渠道状态；新增 `verify:data`、`smoke:routes` 验证脚本；补充 `robots.txt` 与 `sitemap.xml`。
  3. **P2 已做**：抽象 `lib/catalog.ts` 作为服务类型和行业目录层；新增服务类型与行业到服务商/案例的本地匹配逻辑，为后续飞书/数据库内容同步预留结构。
- **新增页面**：
  1. `/services`
  2. `/services/ai-automation`
  3. `/services/ecommerce-visuals`
  4. `/services/content-pipeline`
  5. `/services/private-knowledge`
  6. `/industries/ecommerce`
  7. `/industries/education-consulting`
  8. `/industries/local-life-content`
  9. `/industries/professional-services`
  10. `/robots.txt`
  11. `/sitemap.xml`
- **主要文件**：
  1. `components/shared/Navbar.tsx`：新增桌面端二级下拉和移动端服务类型入口。
  2. `lib/catalog.ts`：新增服务类型、行业目录和匹配函数。
  3. `app/services/*`、`app/industries/*`：新增二级落地页。
  4. `components/shared/LeadContextNotice.tsx`：发布需求页展示并提交咨询上下文。
  5. `components/shared/SubmissionSummary.tsx`：成功页展示请求编号与渠道状态。
  6. `app/sitemap.ts`、`app/robots.ts`：新增 SEO 基础文件。
  7. `scripts/verify-data.mjs`、`scripts/smoke-routes.mjs`：新增本地验证脚本。
- **外部依赖未完成项说明**：
  1. 真实飞书、企业微信、钉钉联调仍需实际密钥和目标表/群。
  2. 真实数据库接入仍按要求保留空接口，暂不连接生产数据库。

## 9. ChatGPT 修改记录（2026-05-01 AI 诊断、客服窗与账号入口批次）

- **执行者**：ChatGPT
- **状态**：已完成并通过验证
- **用户反馈**：首页按钮疑似只回到顶部，缺少明确二级页面；需要右下角智能客服窗；需要注册/登录入口，并优先做好手机号和邮箱登录注册，预留微信、企业微信、飞书。
- **P0 本批处理**：
  1. 新增 `/diagnosis` AI 需求诊断工作台，首页免费诊断类 CTA 改为进入该页。
  2. `/diagnosis` 完成 4 问诊断流程，生成本地摘要，并预留 `NEXT_PUBLIC_DIAGNOSIS_AI_URL` 接入自有 AI。
  3. 全站新增右下角智能客服悬浮窗，支持本地 AI 预设回复、快捷问题和转人工提示，并预留 `NEXT_PUBLIC_SUPPORT_AI_URL`。
  4. 新增 `/login`、`/register`、`/account`，导航加入登录入口。
  5. 手机号和邮箱注册/登录先做前端可用流程；微信、企业微信、飞书登录按钮以预留禁用态展示。
  6. 服务商入驻页增加注册服务商账号提示。
- **说明**：
  1. 当前账号数据只存本地 `localStorage`，不代表真实用户系统。
  2. 短信验证码、邮箱密码、微信/企微/飞书 OAuth 需要后端鉴权服务后才能真实上线。
  3. AI 诊断和 AI 客服目前默认使用本地兜底回复，配置环境变量后可接自有 AI 服务。
- **验证结果**：
  1. `npm run relay:check` 通过。
  2. `npm run verify:data` 通过。
  3. `npm run lint` 通过。
  4. `npm run build` 通过，静态生成 35 个页面。
  5. `npm run smoke:routes` 通过，新增 `/diagnosis`、`/login`、`/register`、`/account` 均返回 200。
  6. 未知动态路由 `/providers/bad-slug`、`/cases/bad-slug`、`/services/bad-slug`、`/industries/bad-slug` 均返回 404。

## 10. ChatGPT 灰度测试记录（2026-05-02 慢网与等待态批次）

- **执行者**：ChatGPT
- **状态**：已完成并通过验证
- **测试目标**：检查灰度环境下是否存在构建、路由、relay、数据一致性问题，并补齐网络拥挤时的等待反馈。
- **初始灰度结果**：
  1. `npm run relay:check` 通过。
  2. `npm run verify:data` 通过。
  3. `npm run lint` 通过。
  4. `npm run build` 通过，静态生成 35 个页面。
- **发现的问题/体验缺口**：
  1. 页面切换缺少全局 `loading` 等待页。
  2. 表单提交只有文字变化，没有旋转等待反馈。
  3. AI 诊断接口没有超时控制，慢网时用户反馈不足。
  4. 智能客服发送消息没有“AI 正在回复”的等待态。
  5. 登录/注册和获取验证码缺少处理中状态。
- **ChatGPT 修改**：
  1. 新增 `app/loading.tsx`，提供全局页面加载等待页。
  2. 新增 `components/shared/LoadingSpinner.tsx`，统一旋转加载图标。
  3. 更新 `components/shared/StaticForm.tsx`，提交按钮增加旋转状态，并确保 fetch 超时定时器在请求结束后清理。
  4. 更新 `components/diagnosis/DiagnosisWorkspace.tsx`，AI 诊断增加慢网等待骨架、按钮禁用、接口超时和本地兜底延迟反馈。
  5. 更新 `components/support/FloatingSupport.tsx`，客服发送增加“AI 正在回复”、接口超时和本地兜底。
  6. 更新 `components/auth/AuthPanel.tsx`，登录/注册、获取验证码增加处理中状态。
  7. 更新 `.env.example`，新增 `NEXT_PUBLIC_DIAGNOSIS_TIMEOUT_MS`、`NEXT_PUBLIC_SUPPORT_TIMEOUT_MS`。
- **验证结果**：
  1. `npm run relay:check` 通过。
  2. `npm run verify:data` 通过。
  3. `npm run lint` 通过。
  4. `npm run build` 通过，静态生成 35 个页面。
  5. `npm run smoke:routes` 通过，核心页面返回 200，未知动态路由返回 404。
  6. relay dry-run 验证通过：`GET /healthz` 返回健康状态；正常需求提交返回 `ok: true`；错误密钥返回 401。
- **已知说明**：
  1. Next dev 在 `output: "export"` 下故意访问未导出的动态路径时，会在控制台打印静态参数诊断；HTTP 返回 404 且生产构建通过，不影响上线静态产物。
  2. 当前慢网等待态覆盖页面切换、线索表单、AI 诊断、智能客服、登录注册和验证码流程。

## 11. ChatGPT 修改记录（2026-05-02 高优先级基础设施批次）

- **执行者**：ChatGPT
- **状态**：已完成并通过验证
- **目标**：在不等待真实第三方密钥/数据库的情况下，继续推进上线前优先级最高的基础设施。
- **本批完成**：
  1. relay 外部渠道增加短重试：`LEAD_CHANNEL_RETRY_COUNT`、`LEAD_CHANNEL_RETRY_BASE_MS`。
  2. relay 内存限流桶增加定时清理，减少长时间运行的无效状态积累。
  3. 表单增加本地草稿自动保存和提交成功后清理，避免用户在网络拥挤或误关闭页面时丢内容。
  4. 表单提交记录同步写入 `localStorage` 最近 10 条。
  5. 账号页 `/account` 展示最近提交记录，便于用户回看需求/入驻申请状态。
  6. 新增系统状态页 `/status`，灰度期展示主站、relay、数据库占位状态。
  7. 新增生产环境变量检查脚本 `npm run check:env`。
  8. 更新 smoke 路由覆盖 `/status`。
- **仍需真实后端后完成**：
  1. 账号系统服务端持久化。
  2. 真实短信/邮箱/微信/企微/飞书 OAuth。
  3. 真实数据库写入。
  4. 生产监控告警。
- **验证结果**：
  1. `npm run relay:check` 通过。
  2. `npm run verify:data` 通过。
  3. `npm run lint` 通过。
  4. `npm run build` 通过，静态生成 36 个页面。
  5. `npm run smoke:routes` 通过，新增 `/status` 返回 200，未知动态路由返回 404。
  6. relay dry-run 通过，`GET /healthz` 返回健康状态，并包含限流与重试配置；正常需求提交返回 `ok: true`。
  7. `npm run check:env` 在未配置生产环境变量时按预期失败，提示缺少 `LEAD_RELAY_SECRET`、`LEAD_ALLOWED_ORIGINS`、`LEAD_CHANNELS`。

## 12. 截至 2026-05-02 的总体进度汇总

- **主站页面**：已完成首页、服务商库、服务商详情、案例库、案例详情、服务类型页、行业页、AI 诊断页、发布需求、服务商入驻、登录、注册、账号页、系统状态页、SLA 与法律文档。
- **二级结构**：已完成导航二级菜单、服务类型二级页、行业二级页，并在发布需求时带入来源上下文。
- **AI 能力预留**：已完成 AI 诊断工作台和智能客服悬浮窗，均有本地兜底与自有 AI 接口环境变量预留。
- **账号入口**：已完成手机号/邮箱前端注册登录流程，微信、企业微信、飞书登录为预留入口。
- **线索中转**：已完成 relay、健康检查、CORS、共享密钥、body 限制、JSON 校验、请求编号、限流、超时、渠道重试、飞书/企微/钉钉适配器、dry-run。
- **数据库**：已按要求保留 `relay/database.mjs` 空接口，暂不连接真实数据库。
- **用户体验**：已完成全局 loading、表单提交 spinner、AI 诊断等待态、智能客服等待态、登录/验证码处理中、表单草稿保存、成功页提交结果展示、账号页最近提交记录。
- **灰度与验证**：已完成 `verify:data`、`smoke:routes`、`check:env`、`relay:check` 等脚本；每次重大改动均已写入 SPEC 并提交 Git。
- **Git 保存点**：已有 `72214fc`、`41936a5`、`9863988`、`9ba40e4`、`733acc2`，本批次将继续提交新的保存点。

## 13. ChatGPT 修改记录（2026-05-02 安全与三级页面批次）

- **执行者**：ChatGPT
- **状态**：已完成并通过验证
- **本批最高优先级判断**：
  1. 账号验证码此前仍偏演示，属于上线前最高安全风险。
  2. 表单仅有蜜罐和限流，缺少可强制开启的防机器人验证码。
  3. 微信支付未明确接口状态，容易被误认为已可用。
  4. 二级页面已完成，但缺少“服务类型 × 行业”的三级承接页。
- **ChatGPT 修改**：
  1. 新增 `components/shared/TurnstileField.tsx`，前端通过 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 显示 Cloudflare Turnstile。
  2. 更新 `components/shared/StaticForm.tsx`，线索表单提交 `captchaToken`，继续保留隐藏蜜罐。
  3. 更新 `relay/lead-relay.mjs`，新增 Turnstile 服务端验证、字段长度限制、控制字符清理、手机号校验、来源 URL 校验。
  4. 更新 `relay/lead-relay.mjs`，新增 `/api/auth/code` 与 `/api/auth/session`，手机号/邮箱验证码在服务端按 HMAC 存储，含 TTL 与最大尝试次数；dry-run 才返回 `devCode`。
  5. 更新 `components/auth/AuthPanel.tsx`，手机号和邮箱统一改为验证码登录/注册；配置 `NEXT_PUBLIC_AUTH_RELAY_URL` 后走服务端验证码，未配置时仅保留静态演示验证码 `123456`。
  6. 更新 `relay/lead-relay.mjs`，新增 `/api/payments/wechat/prepay` 安全占位；未配置微信支付返回 503，配置齐全但签名实现未完成返回 501。
  7. 新增 `/solutions/[service]/[industry]` 三级方案页，并从服务类型页、行业页进入；静态导出 16 个组合页。
  8. 更新 `.env.example`、`scripts/check-env.mjs`、`docs/integrations.md`、`relay/README.md`，补充 Turnstile、验证码、微信支付生产配置要求。
- **接口预留状态**：
  1. 飞书、企业微信、钉钉线索接口已在 relay 中保留并 dry-run 验证。
  2. 微信、企业微信、飞书 OAuth 登录入口仍保持禁用预留，等待真实开放平台应用参数。
  3. 微信支付已新增后端安全占位，但真实签名、回调验签、订单幂等、退款权限仍未启用。
- **验证结果**：
  1. `npm run relay:check` 通过。
  2. `npm run verify:data` 通过。
  3. `npm run lint` 通过。
  4. `npm run build` 通过，静态生成 53 个页面。
  5. relay dry-run 验证通过：`GET /healthz` 返回 captcha/auth/payments 状态；`POST /api/leads` 企业需求与服务商入驻均返回 `ok: true`；`POST /api/auth/code` 返回 dry-run `devCode`；`POST /api/auth/session` 可用正确验证码换取账号；错误验证码被拒绝。
  6. `LEAD_CAPTCHA_REQUIRED=true` 且缺少 token 时，线索提交按预期返回“请先完成人机校验”。
  7. 微信支付占位接口在未配置 `WECHAT_PAY_*` 时按预期返回 503。

## 14. ChatGPT 修改记录（2026-05-02 账号密码与新设备验证批次）

- **执行者**：ChatGPT
- **状态**：已完成并通过验证
- **用户反馈**：登录入口应保留基础账号密码；注册和首次在某台设备登录账号时，再通过手机或邮箱验证码确认，而不是只能验证码登录。
- **参考原则**：按 OWASP MFA/Authentication 建议，密码作为基础凭证，短信/邮箱验证码作为额外因子；OTP 需要短 TTL、单次使用、限制尝试次数，且新设备属于风险触发场景。
- **ChatGPT 修改**：
  1. `components/auth/AuthPanel.tsx` 恢复密码字段，注册必须“账号 + 密码 + 验证码”；登录先“账号 + 密码”，新设备再提示验证码。
  2. `lib/auth.ts` 新增本机设备 ID 存储键与生成函数，用于前端向 relay 上报设备标识。
  3. `relay/lead-relay.mjs` 新增内存账号仓库、scrypt 密码哈希、设备信任集合；注册成功信任当前设备，登录新设备时返回 `requiresVerification` 并要求验证码。
  4. 静态演示模式保留本地模拟：验证码固定 `123456`，并在本地记录演示密码和设备信任；正式上线必须使用 relay 和真实数据库。
  5. 更新登录/注册页面文案、`relay/README.md`、`docs/integrations.md`，明确当前账号机制。
- **验证结果**：
  1. `npm run relay:check` 通过。
  2. `npm run verify:data` 通过。
  3. `npm run lint` 通过。
  4. `npm run build` 通过，静态生成 53 个页面。
  5. relay dry-run 验证通过：注册需要验证码和密码；已信任设备可仅用账号密码登录；新设备登录无验证码时返回 `requiresVerification: true`；新设备输入正确验证码后登录成功；错误密码被拒绝。
