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
