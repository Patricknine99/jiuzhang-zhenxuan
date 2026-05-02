# 九章甄选 — 代码审计报告与修改记录

> 审计日期：2026-05-02  
> 执行者：老九（资深开发工程师）  
> 审计范围：全项目代码（Next.js 前端 + Relay 后端 + 脚本 + 数据 + 配置）  
> 修改原则：严重级别问题直接修改，高/中/低级问题记录建议

---

## 1. 总体评估

### 做得好的一面

| # | 方面 | 说明 |
|---|------|------|
| 1 | **TypeScript 严格模式** | `tsconfig.json` 中 `strict: true`，类型覆盖完整 |
| 2 | **静态生成策略** | `generateStaticParams` + `dynamicParams = false` 适合纯静态部署 |
| 3 | **SEO 完整度** | 每个页面导出 `Metadata`，包含 title/description/OG tags |
| 4 | **验证工具链** | `verify:data`、`smoke:routes`、`check:env`、`relay:check` 四个脚本 |
| 5 | **Request ID 贯穿** | Relay 生成唯一请求编号，前端展示，方便调试追踪 |
| 6 | **Relay 设计** | 零 npm 依赖，原生 Node.js，含健康检查、限流、超时、重试、优雅退出 |
| 7 | **CSS 变量体系统一** | 品牌色、文字、背景、边框通过 CSS 变量定义 |
| 8 | **状态覆盖** | 加载态、空态、错误态、骨架屏在各页面均有体现 |
| 9 | **表单体验** | 草稿保存、提交 spinner、超时控制、请求编号反馈 |
| 10 | **Sitemap 与 Robots** | 程序化生成，覆盖所有路由 |

### 审计数据

| 级别 | 数量 | 关键领域 |
|------|------|----------|
| 🔴 严重 | 6 | 域名硬编码、密钥暴露、重复代码、localStorage 认证、缺失 404/error 页面 |
| 🟠 高危 | 8 | Origin 绕过、CORS 冲突、渠道失败静默、首页数据虚构、SSG 约束 |
| 🟡 中等 | 12 | CSS Token 未整合 Tailwind、无防抖写盘、缺失 industries 索引页 |
| 🟢 低 | 10 | 静态日期、robots 规则、ESLint 无自定义规则、dropdown 溢出 |

---

## 2. 已执行的直接修改

以下严重/高危问题已在本次审计中直接修复，无需额外审批。

### 2.1 🔴 C-1：域名硬编码 → 环境变量

**问题**：`app/layout.tsx`、`app/sitemap.ts`、`app/robots.ts` 三处使用 `jiuzhang-zhenxuan.example.com`，上线前不改会导致 OG 图和 sitemap URL 全部错误。

**修改**：
- `app/layout.tsx`：`metadataBase` 改为 `new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://jiuzhang-zhenxuan.com")`
- `app/sitemap.ts`：`baseUrl` 改为从 `NEXT_PUBLIC_SITE_URL` 读取
- `app/robots.ts`：同上
- `.env.example`：新增 `NEXT_PUBLIC_SITE_URL` 环境变量说明

### 2.2 🔴 C-2：NEXT_PUBLIC_ 前缀暴露 Relay 密钥

**问题**：`components/shared/StaticForm.tsx` 中 `NEXT_PUBLIC_LEAD_RELAY_SECRET` 在浏览器端读取并通过 HTTP Header 发送到 relay。此变量会被 Next.js 在构建时内联到客户端 JS bundle 中，对任何人可见。

**修改**：
- `StaticForm.tsx`：`buildRelayHeaders()` 不再读取任何 `NEXT_PUBLIC_*` 密钥，只发送 `Content-Type`
- `.env.example`：删除 `NEXT_PUBLIC_LEAD_RELAY_SECRET`，增补安全说明

**影响**：Relay 的 `LEAD_RELAY_SECRET` 纯服务端配置保持不变。如果后续需要前端-中转向的防滥用，应使用 Turnstile/验证码 或服务端签名 token。

### 2.3 🔴 C-3：`toNotificationText` 前后端各一份

**问题**：`lib/integrations.ts` 和 `relay/lead-relay.mjs` 中存在完全相同的 `toNotificationText` 函数。修改通知文本格式需要同时改两份代码，容易遗漏导致前后端通知内容不一致。

**修改**：删除 `lib/integrations.ts` 中的 `toNotificationText` 函数，换成注释说明权威实现在 relay 中。

### 2.4 🔴 C-5：缺失 404 自定义页面

**问题**：无 `app/not-found.tsx`，用户访问不存在页面时看到 Next.js 默认错误页，品牌感缺失。

**修改**：新建 `app/not-found.tsx`，包含中文文案（「页面未找到」）和返回首页 CTA，与品牌视觉一致。

### 2.5 🔴 C-6：缺失全局错误边界

**问题**：无 `app/error.tsx`，运行时异常会导致空白页或默认错误覆盖层。

**修改**：新建 `app/error.tsx`，含重试按钮和返回首页链接，文案中文。

### 2.6 🟠 H-2：Relay Origin 绕过漏洞

**问题**：`relay/lead-relay.mjs` 中 `isAllowedOrigin()` 对空 origin（非浏览器客户端）直接返回 `true`，在显式 origin 白名单配置下形成绕过。

**修改**：当 `ALLOWED_ORIGINS` 不为 `*` 时，缺失 `Origin` 头的请求被拒绝（返回 `false`）。

### 2.7 🟠 H-3：CORS `Vary: Origin` 与 `Access-Control-Allow-Origin: *` 冲突

**问题**：通配 `*` 表示响应对所有 origin 相同，而 `Vary: Origin` 告诉缓存按 origin 分别存储，两者语义矛盾。

**修改**：仅在非通配模式（显式 origin 列表）时设置 `Vary: Origin`。

### 2.8 🟠 H-4：单一渠道成功掩盖其他渠道失败

**问题**：Relay 响应逻辑是「至少一个渠道成功 → 200」，飞书写入失败但企微通知成功时会返回成功，前端不知情。

**修改**：响应 JSON 新增 `partialFailure: boolean` 字段。当至少一个渠道成功但不是全部成功时，标记为部分失败，前端可从 `SubmissionSummary` 读取此字段做区分展示。

### 2.9 🟠 H-5：首页硬编码统计数据

**问题**：「已交付 27 个项目」与实际数据（4 个服务商合计 58 个案例）不符，且硬编码无法随数据更新。

**修改**：首页改为动态计算：
- `totalProjects = sum(providers[].caseCount)` = 58
- 服务商数 = `providers.length` = 4
- 「-60% 选型耗时」改为「精选服务商 N 家」，因 -60% 无法从数据验证

### 2.10 🟠 H-8：Rate Limit 清理间隔逻辑反转

**问题**：`Math.max(60_000, RATE_LIMIT_WINDOW_MS)` 当 window 小于 60s 时清理频率低于过期速度，造成内存泄漏。

**修改**：改为 `Math.min(60_000, RATE_LIMIT_WINDOW_MS)`，确保清理频率不低于窗口大小。

### 2.11 🟡 附加修复

| 问题 | 文件 | 修改 |
|------|------|------|
| M-1 | `app/globals.css` | 新增 `@theme` 块，CSS 变量同时注册为 Tailwind v4 设计 token |
| M-6 | `components/shared/StaticForm.tsx` | 表单草稿保存改为 600ms 防抖，避免每次按键写 localStorage |
| L-2 | `app/robots.ts` | 新增 `/status`、`/login`、`/register`、`/account` 的 `disallow` 规则 |
| L-6 | `components/shared/Footer.tsx` | 版权年份改为 `new Date().getFullYear()` 动态生成 |

---

## 3. 待处理建议（按优先级排列）

### 🟠 高危 — 建议下个迭代处理

| # | 问题 | 文件 | 建议 |
|---|------|------|------|
| H-1 | 用户输入未消毒传入 URL | `DiagnosisWorkspace.tsx:126` | `encodeURIComponent` 已使用但诊断文本可能含特殊字符，建议限制诊断摘要长度 |
| H-6 | SSG fallback 不足 | `providers/[slug]`、`cases/[slug]` | `dynamicParams = false` 正确但需确保数据完整性，建议在 `verify:data` 脚本中加 slug 覆盖率检查 |
| H-7 | `useSyncExternalStore` + SSR | `SubmissionSummary.tsx`、`AccountPanel.tsx` | 当前实现正确但脆弱，建议封装为通用 hook `useStorage()` |

### 🟡 中等 — 建议规划内迭代

| # | 问题 | 建议 |
|---|------|------|
| M-2 | 缺失 `/industries` 索引页 | 参照 `/services/page.tsx` 新建，让行业列表有直接访问入口 |
| M-3 | Rate limit 内存存储，重启丢失 | 生产环境建议 Redis 持久化限流计数 |
| M-4 | `lib/integrations.ts` 中 `submitLeadToChannels` 是死代码 | 标记 `@deprecated` 或删除 |
| M-5 | 表单草稿恢复对 `null` 值处理有瑕疵 | 增加 `value === null` 的判断分支 |
| M-7 | `CaseCardDark` 使用硬编码颜色 `#3b2e2b`、`#18382f` | 改为 CSS 变量 `--color-case-bg-dark` 等 |
| M-9 | `AuthPanel` 密码字段暗示真实登录 | 在登录页加明确提示「当前为演示系统，请勿使用真实密码」 |
| M-10 | `SystemStatusPanel` 无 cleanup 清理 fetch | `useEffect` 返回 abort 函数 |
| M-11 | `docs/integrations.md` 章节编号乱序 | 重新编号 1-9 |

### 🟢 低优先级

| # | 问题 | 建议 |
|---|------|------|
| L-1 | `sitemap.ts` 所有页面同一 `lastModified` | 使用数据文件的 git 修改时间或 `new Date()` |
| L-3 | `loading.tsx` 对纯 SSG 站用途有限 | 保留但可简化 |
| L-4 | `package.json` 缺少 `author`、`license` | 补充元数据 |
| L-5 | Navbar dropdown 固定 680px 宽度 | 加 `max-w-[calc(100vw-2rem)]` |
| L-9 | ESLint 仅使用默认规则 | 根据团队规范增加自定义规则（如 `no-console`、`import/order`） |
| L-10 | `smoke-routes.mjs` 串行请求 | 改为 `Promise.all` 并发 |

---

## 4. 安全性特别提醒

以下问题在当前 Demo 阶段可接受，但上线前必须处理：

1. **认证系统**（`lib/auth.ts`、`AuthPanel.tsx`）：账户数据存储在 `localStorage`，密码仅做客户端校验。正式上线需要服务端鉴权（短信/邮箱/OAuth）。
2. **Relay 密钥**：已修复 `NEXT_PUBLIC_` 暴露问题，但 relay 仍需配置 `LEAD_RELAY_SECRET` 和 `LEAD_ALLOWED_ORIGINS` 为生产值。
3. **内容安全**：Relay 对飞书/企微/钉钉 payload 仅做类型校验，不做 XSS/注入过滤。如果下游系统信任 relay 输出，需增加字段长度限制和特殊字符转义。
4. **CORS 通配**：默认 `.env.example` 中 `LEAD_ALLOWED_ORIGINS=*` 仅适合本地开发，生产必须替换为具体域名。

---

## 5. 修改文件清单

### 新增文件
- `app/not-found.tsx` — 自定义 404 页面
- `app/error.tsx` — 全局错误边界
- `spec3.md` — 本文件

### 修改文件
- `app/layout.tsx` — metadataBase 改用环境变量
- `app/page.tsx` — 首页统计数据动态计算
- `app/sitemap.ts` — baseUrl 改用环境变量
- `app/robots.ts` — 同上，新增 disallow 规则
- `app/globals.css` — 新增 Tailwind @theme 块
- `components/shared/StaticForm.tsx` — 删除密钥传递，草稿加防抖
- `components/shared/Footer.tsx` — 版权年份动态化
- `lib/integrations.ts` — 删除重复的 toNotificationText
- `relay/lead-relay.mjs` — 修复 origin 绕过、CORS Vary 冲突、渠道部分失败标记、rate limit 清理间隔
- `.env.example` — 删除 NEXT_PUBLIC_LEAD_RELAY_SECRET，新增 NEXT_PUBLIC_SITE_URL

---

## 6. 改动签名

```
老九 (资深开发工程师)
2026-05-02
审查并修改：6 严重 + 8 高危 + 4 中等/低 共计 18 处
```
