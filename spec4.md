# 九章甄选 — 安全与质量修复记录（2026-05-02）

> 执行者：资深开发工程师  
> 处理范围：严重问题 4 项 + 高危问题 6 项（其中高危 4 项已修复，2 项延期并记录缓解方案）  
> 关联报告：`docs/tech-review-20260502.md`

---

## 1. 修复概览

本次处理覆盖技术评估中发现的全部 4 个严重问题和 6 个高危问题，涵盖 Relay 后端安全、认证校验、输入处理、测试覆盖和 CI 自动化。其中高危问题里的集群化与持久化改造暂不实施，已在本文件记录原因、缓解方案和后续批次。

---

## 2. 严重问题修复

### S-1：scrypt 同步阻塞事件循环 → 改为异步

**问题**：`relay/lead-relay.mjs` 中使用 `scryptSync` 进行密码哈希计算，同步调用会阻塞 Node.js 事件循环，在高并发场景下导致服务无法响应其他请求。

**修改**：
- 导入 `scrypt`（异步）和 `promisify`，删除 `scryptSync`
- `hashPassword()` 和 `verifyPassword()` 改为 `async` 函数
- `createAuthAccount()` 和调用方同步添加 `await`

**验证**：`npm run relay:check` 通过。

### S-2：HMAC 硬编码默认密钥 → 启动时强制校验

**问题**：`signValue()` 函数在 `SHARED_SECRET` 为空时回退到 `"jiuzhang-dev-secret"`，攻击者可轻易伪造签名。

**修改**：
- 启动时检查 `LEAD_RELAY_SECRET`，若未设置或长度小于 16 字符，服务直接退出并输出错误信息
- `signValue()` 不再使用默认回退值

**验证**：未设置 `LEAD_RELAY_SECRET` 时启动 relay，按预期输出 FATAL 错误并退出。

### S-3：账号系统 localStorage 存储 → 添加明确过渡提示

**问题**：账号数据存储在浏览器 `localStorage` 中，存在 XSS 读取和客户端篡改权限风险。

**修改**：
- 登录/注册页面顶部添加醒目的开发阶段说明条
- 明确告知用户当前为过渡方案，后续将接入服务端认证系统
- 提示用户勿使用与其他平台相同的密码

**说明**：完整的服务端认证迁移已列入下一批次任务（见第 4 节）。

### S-4：测试覆盖率为 0 → 引入 Vitest + 33 个单元测试

**问题**：项目无任何自动化测试，重构和新增功能时缺乏回归保护。

**修改**：
- 安装 `vitest`、`@testing-library/react`、`@testing-library/jest-dom`、`jsdom`
- 配置 `vitest.config.ts`（含 `@/` 路径别名）
- 编写测试套件：
  - `__tests__/auth.test.ts`：邮箱/手机号校验、密码复杂度（11 个测试）
  - `__tests__/data.test.ts`：服务商/案例排序、过滤、格式化（12 个测试）
  - `__tests__/catalog.test.ts`：目录匹配逻辑（10 个测试）
- `package.json` 新增 `test` 和 `test:watch` 脚本

**验证**：`npm run test` — 3 个测试文件全部通过，33/33 测试通过。

---

## 3. 高危问题处理

### H-1：用户输入缺少 XSS 过滤和统一消毒

**问题**：表单提交直接将用户输入拼接到通知文本和 payload 中，未做字符过滤。

**修改**：
- `components/shared/StaticForm.tsx` 新增 `sanitizeInput()` 函数
- 过滤尖括号 `<>`，去除首尾空白，限制最大 2000 字符
- `getString()` 和 `getOptionalString()` 自动应用消毒

### H-2：缺少 HTTP 安全头

**问题**：Relay 响应未设置 `X-Frame-Options`、`X-Content-Type-Options` 等安全头，存在点击劫持和 MIME 嗅探风险。

**修改**：
- `relay/lead-relay.mjs` 新增 `setSecurityHeaders()` 函数
- 每个响应自动附加：
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-XSS-Protection: 1; mode=block`

### H-3：Relay 单进程无集群支持

**问题**：单进程 HTTP 服务无法利用多核 CPU，进程崩溃即服务中断。

**状态**：本次未实施集群改造。
**原因**：当前阶段服务负载低，且集群化涉及会话共享、限流桶同步等复杂问题。已列入中期任务（见第 4 节）。
**缓解**：进程崩溃可通过外部进程管理器（PM2/systemd）重启兜底。

### H-4：内存存储重启丢失

**问题**：限流桶、验证码桶、账号数据全部存储在内存 `Map` 中，进程重启即丢失。

**状态**：本次未接入 Redis/数据库。
**原因**：项目当前为过渡阶段，数据量小，且涉及部署架构调整。已列入中期任务（见第 4 节）。
**缓解**：限流桶已有定时清理机制；账号数据在正式上线前会迁移至服务端持久化。

### H-5：验证码无限发送

**问题**：`handleAuthCodeRequest` 仅按 IP 限流，未限制单个手机号/邮箱的发送频率，可被用于短信/邮件轰炸。

**修改**：
- 新增 `SEND_CODE_COOLDOWN` Map 和 `SEND_CODE_COOLDOWN_MS = 60_000`
- 每个 identifier（手机号/邮箱）60 秒内只能发送 1 次验证码
- 超出频率返回 `429` 和剩余等待秒数

### H-6：密码缺少复杂度校验

**问题**：注册时仅检查密码长度 ≥ 8，无字母、数字、特殊字符要求。

**修改**：
- `lib/auth.ts` 新增 `validatePassword()` 函数
- 要求：≥ 8 位、包含字母、包含数字、包含特殊字符
- `components/auth/AuthPanel.tsx` 注册流程接入校验，实时提示具体不满足项

---

## 4. 工程化改进

### CI/CD 自动化

- 新增 `.github/workflows/ci.yml`
- 每次 push/PR 自动执行：lint → test → verify:data → relay:check → build
- 任何步骤失败即阻断合并

---

## 5. 验证结果

| 检查项 | 结果 |
|--------|------|
| `npm run lint` | ✅ 通过 |
| `npm run test` | ✅ 33/33 通过 |
| `npm run verify:data` | ✅ 通过 |
| `npm run relay:check` | ✅ 通过 |
| `npm run build` | ✅ 54 页面静态生成成功 |
| GitHub push | ✅ `4c0b594` 已推送 |

---

## 6. 仍保留至后续批次的问题

以下问题已识别，但本次未修复，计划在后续迭代中处理：

| 问题 | 优先级 | 计划批次 |
|------|--------|----------|
| Relay 单进程 → cluster/多worker | P1 | 中期（框架化时同步做） |
| 内存存储 → Redis/PostgreSQL 持久化 | P1 | 中期（接入数据库时同步做） |
| 前端 Client Component 边界优化 | P2 | 中期 |
| 图片优化（WebP/响应式尺寸） | P2 | 中期 |
| CSP (Content-Security-Policy) 策略 | P2 | 中期 |

---

## 7. 修改文件清单

### 新增文件
- `.github/workflows/ci.yml`
- `__tests__/auth.test.ts`
- `__tests__/catalog.test.ts`
- `__tests__/data.test.ts`
- `vitest.config.ts`
- `vitest.setup.ts`

### 修改文件
- `relay/lead-relay.mjs` — 异步 scrypt、安全头、密钥校验、验证码冷却
- `lib/auth.ts` — 密码复杂度校验
- `components/auth/AuthPanel.tsx` — 密码校验接入、过渡提示
- `components/shared/StaticForm.tsx` — 输入消毒
- `package.json` — test 脚本
- `package-lock.json` — 依赖更新

---

## 8. ChatGPT 继续任务记录（2026-05-02 数据与表单质量批次）

- **执行者**：ChatGPT
- **状态**：已完成并通过验证
- **处理原因**：在暂不接入真实 Redis/PostgreSQL 与第三方密钥的前提下，优先处理当前代码可落地且能降低上线风险的质量项。
- **本批完成**：
  1. `lib/data.ts` 增加运行时数据结构校验，覆盖服务商与案例字段类型、重复 slug、评分范围、预算/周期区间，以及案例引用服务商是否存在。
  2. `components/shared/StaticForm.tsx` 补齐多选字段输入消毒，避免入驻方向绕过统一过滤。
  3. `components/shared/StaticForm.tsx` 增加手机号格式校验，需求表单与入驻表单在提交 relay 前先过滤无效大陆手机号。
  4. `components/shared/StaticForm.tsx` 增加入驻案例数量校验，要求至少 3 行案例链接或案例说明，与页面文案保持一致。
  5. `components/shared/StaticForm.tsx` 增强本地提交记录读取容错，坏 JSON 会自动清理，不再影响后续提交。
- **验证结果**：
  1. `npm run lint` 通过。
  2. `npm run test` 通过，33/33 测试通过。
  3. `npm run verify:data` 通过。
  4. `npm run relay:check` 通过。
  5. `npm run build` 通过，54 页面静态生成成功。

---

---

## 9. Kimi 2.6 改动 — Redis + PostgreSQL 接入与持久化（2026-05-02）

- **执行者**：Kimi 2.6
- **状态**：已完成并通过验证
- **处理原因**：用户要求接入本地 Redis 和 PostgreSQL，模拟真实运行环境，替代原有的内存存储方案。
- **本批完成**：
  1. **数据库初始化脚本**：新增 `scripts/init-db.mjs`，自动创建数据库（如果不存在），建表（providers、cases、leads、auth_accounts、auth_codes、admin_accounts、audit_logs），导入 JSON 数据，创建管理员账号。
  2. **PostgreSQL 连接模块**：新增 `relay/db.mjs`，导出连接池 `pool`、参数化查询 `query()`、事务客户端 `getClient()`、优雅关闭 `closePool()`。
  3. **Redis 连接模块**：新增 `relay/redis.mjs`，提供滑动窗口限流 `consumeRateLimitRedis()`、验证码存取 `setAuthCode/getAuthCode/deleteAuthCode`、发送冷却 `checkSendCooldown()`。
  4. **数据库操作层重写**：`relay/database.mjs` 从占位函数重写为真实数据库操作，覆盖线索保存/更新/查询、验证码存取（Redis 优先 + PostgreSQL fallback）、账号认证、管理员查询、审计日志。
  5. **Relay 核心逻辑重写**：`relay/lead-relay.mjs` 移除所有内存 `Map`，限流/验证码/冷却/账号全部切到 Redis/PostgreSQL；新增 `verifyCodeHash()` 修复验证码验证失败的 bug（签名比较需先生成 HMAC 再常量时间比对）。
  6. **环境配置**：`.env.example` 和 `.env` 新增 `DATABASE_URL`、`REDIS_URL`，`LEAD_RELAY_SECRET` 随机生成。
- **验证结果**：
  1. Health check：PostgreSQL + Redis 均 connected。
  2. 线索提交：数据存入 leads 表（id=1）。
  3. 管理员登录：返回 JWT-style token，audit_logs 有记录。
  4. 验证码请求：Redis 存储，dry-run 返回 devCode。
  5. 用户注册：账号存入 auth_accounts。
  6. 用户登录：信任设备自动识别。
- **新增文件**：
  - `scripts/init-db.mjs`
  - `relay/db.mjs`
  - `relay/redis.mjs`
- **修改文件**：
  - `relay/database.mjs` — 真实数据库操作
  - `relay/lead-relay.mjs` — 移除内存存储，接入 Redis/PostgreSQL
  - `.env.example` — 新增数据库连接配置
  - `.env` — 本地环境配置

---

*修复完成时间：2026-05-02*  
*Git 提交：`4c0b594`*
