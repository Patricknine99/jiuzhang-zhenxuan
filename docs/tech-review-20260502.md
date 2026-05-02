# 九章甄选 — 资深开发工程师技术评估报告

> 评估日期：2026-05-02  
> 评估范围：全栈代码（Next.js 前端 + Relay 后端 + 脚本 + 数据层）  
> 评估维度：架构设计 / 代码质量 / 安全性 / 性能 / 工程化 / 可维护性

---

## 一、总体评估

### 1.1 项目概况

| 维度 | 状态 | 评分 |
|------|------|------|
| 架构设计 | 合理，SSG 策略适合当前阶段 | ⭐⭐⭐⭐☆ |
| 代码质量 | TypeScript 覆盖完整，但部分模式待优化 | ⭐⭐⭐⭐☆ |
| 安全性 | 中等，Demo 阶段可接受，上线前需加固 | ⭐⭐⭐☆☆ |
| 性能优化 | 基础到位，有优化空间 | ⭐⭐⭐⭐☆ |
| 工程化 | 脚本工具链完善，但缺少自动化测试 | ⭐⭐⭐☆☆ |
| 文档规范 | SPEC 记录详尽，代码注释不足 | ⭐⭐⭐⭐☆ |

### 1.2 做得好的地方（继续保持）

1. **SSG 策略选择正确**：`output: "export"` + `generateStaticParams` 适合纯展示型站点，部署简单、成本低
2. **TypeScript 严格模式**：`strict: true` 配置到位，类型定义清晰
3. **Relay 零依赖设计**：原生 Node.js HTTP 服务，减少依赖攻击面
4. **验证工具链完整**：`verify:data`、`smoke:routes`、`check:env`、`relay:check` 四个脚本形成质量门禁
5. **SEO 基础扎实**：每个页面都有 `Metadata`，sitemap/robots 程序化生成
6. **用户体验细节**：加载态、空态、错误态、草稿保存、防抖处理均有覆盖
7. **SPEC 变更记录**：开发日志规范，便于追溯和团队协作

### 1.3 核心风险摘要

| 风险等级 | 数量 | 关键问题 |
|----------|------|----------|
| 🔴 严重 | 4 | 内存账号系统、localStorage 密码、Relay 单进程、无自动化测试 |
| 🟠 高危 | 6 | 前端密钥残留风险、CORS 生产配置、XSS 过滤缺失、无输入校验库 |
| 🟡 中等 | 8 | 代码重复、类型断言、缺少单元测试、组件粒度不均 |
| 🟢 低 | 5 | 脚本性能、文档细节、依赖版本锁定 |

---

## 二、分模块详细审查

### 2.1 前端架构（Next.js App Router）

#### ✅ 优点
- App Router + Server Component 使用正确，页面级数据获取在服务端完成
- `dynamicParams = false` 明确限制了动态路由，避免构建期意外
- 组件目录按功能域划分（`shared/`、`auth/`、`admin/`、`diagnosis/`），结构清晰

#### ⚠️ 问题与建议

**问题 F-1：Client Component 边界不够清晰**

当前 `"use client"` 标记在表单、认证、客服等组件上，但部分页面（如 `/admin`）理论上可以拆出更多 Server Component 来减少客户端 JS 体积。

**建议**：
```tsx
// 当前：整个 AdminConsole 都是 Client Component
// 优化：把静态布局拆成 Server Component，只把交互部分留作 Client
// app/admin/page.tsx
import { AdminShell } from "@/components/admin/AdminShell"; // Server
import { AdminConsoleClient } from "@/components/admin/AdminConsoleClient"; // Client

export default function AdminPage() {
  return (
    <AdminShell>
      <AdminConsoleClient />
    </AdminShell>
  );
}
```

**问题 F-2：CSS 变量重复定义**

`globals.css` 中 `@theme` 块和 `:root` 块定义了完全相同的变量，冗余。

**建议**：保留 `@theme`（Tailwind v4 设计 token），删除 `:root` 重复项，或改用 `@theme` 的 `inline` 机制。

**问题 F-3：组件粒度不均**

`StaticForm.tsx` 接近 300 行，承担了表单渲染、草稿管理、提交逻辑、错误处理多个职责。

**建议**：拆分为：
- `FormShell.tsx` — 布局与状态管理
- `DraftManager.ts` — 草稿存取逻辑（纯函数）
- `SubmitHandler.ts` — 提交与错误处理

---

### 2.2 后端服务（Relay）

#### ✅ 优点
- 原生 Node.js HTTP，零 npm 依赖，部署体积极小
- 健康检查、限流、超时、重试、优雅退出等生产特性齐全
- 请求编号（Request ID）贯穿全链路，便于日志追踪

#### ⚠️ 问题与建议

**问题 B-1：单进程无集群支持**

`relay/lead-relay.mjs` 是单进程 HTTP 服务，无法利用多核 CPU，且进程崩溃会导致服务中断。

**建议**（短期 + 长期）：
```javascript
// 短期：使用 Node.js cluster 模块
import cluster from "node:cluster";
import os from "node:os";

if (cluster.isPrimary) {
  const numCPUs = os.availableParallelism();
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on("exit", (worker) => {
    console.error(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  // 现有 server.listen() 逻辑
}

// 长期：迁移到 Express/Fastify + PM2/Docker，或直接用云函数
```

**问题 B-2：内存存储无法持久化**

限流桶（`RATE_LIMIT_BUCKETS`）、验证码桶（`AUTH_CODE_BUCKETS`）、账号数据（`AUTH_ACCOUNTS`）全部存储在内存中，进程重启即丢失。

**建议**：
- 限流：生产环境接入 Redis
- 验证码：使用 Redis 或数据库，设置 TTL
- 账号：必须迁移到数据库（PostgreSQL/MySQL）

**问题 B-3：scrypt 同步阻塞**

```javascript
// relay/lead-relay.mjs 中
const hash = scryptSync(password, salt, 64); // 同步调用，阻塞事件循环
```

`scryptSync` 在密码较长或迭代次数高时会阻塞 Node.js 事件循环，影响并发请求处理。

**建议**：改为异步 `scrypt`：
```javascript
import { scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password, salt) {
  const buf = await scryptAsync(password, salt, 64);
  return buf.toString("hex");
}
```

**问题 B-4：HMAC 会话签名密钥管理**

```javascript
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "dev-only-secret";
```

环境变量缺失时使用了硬编码的默认密钥，这是严重的安全隐患。

**建议**：
```javascript
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
if (!ADMIN_SESSION_SECRET || ADMIN_SESSION_SECRET.length < 32) {
  console.error("FATAL: ADMIN_SESSION_SECRET must be set and at least 32 characters");
  process.exit(1);
}
```

---

### 2.3 认证与授权

#### ⚠️ 严重问题

**问题 A-1：localStorage 存储账号数据**

```typescript
// lib/auth.ts
const authStorageKey = "jiuzhang:auth:account";
// 账号信息、密码哈希（虽然是 scrypt，但仍在前端计算）全部存在 localStorage
```

风险：
- XSS 攻击可直接读取所有账号信息
- 用户可以轻松修改 localStorage 中的 "role" 字段提升权限
- 密码在前端计算哈希，无法防止重放攻击

**建议**：
当前 Demo 阶段可保留，但必须在登录/注册页面加 **醒目提示**：
> ⚠️ 当前为演示系统，账号数据仅存储在本地浏览器中。正式上线后将迁移至服务端认证。

**问题 A-2：缺少密码复杂度校验**

注册时未校验密码长度、复杂度，用户可能使用 "123456"。

**建议**：
```typescript
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: "密码至少 8 位" };
  if (!/[A-Za-z]/.test(password)) return { valid: false, message: "需包含字母" };
  if (!/\d/.test(password)) return { valid: false, message: "需包含数字" };
  return { valid: true };
}
```

**问题 A-3：验证码暴力破解无防护**

`AUTH_CODE_MAX_ATTEMPTS` 仅针对单条验证码，未限制发送频率，可无限发送验证码轰炸。

**建议**：增加发送频率限制：
```javascript
// 每个手机号/邮箱每 60 秒只能发送 1 次
const SEND_COOLDOWN_MS = 60_000;
```

---

### 2.4 数据层与类型安全

#### ✅ 优点
- `lib/types.ts` 类型定义清晰，Provider/CaseStudy 结构完整
- `lib/catalog.ts` 的目录抽象合理，便于后续替换为数据库

#### ⚠️ 问题与建议

**问题 D-1：JSON 数据无版本控制**

`data/providers.json` 和 `data/cases.json` 是当前数据源，但无 schema 版本号，后续格式变更时难以兼容。

**建议**：增加 schema 版本：
```json
{
  "_schemaVersion": "1.0.0",
  "providers": [...]
}
```

**问题 D-2：类型断言过多**

```typescript
import providers from "@/data/providers.json";
// providers 被直接断言为 Provider[]
```

缺少运行时校验，JSON 数据格式错误时会在运行时报错而非构建期。

**建议**：使用 Zod 做运行时校验：
```typescript
import { z } from "zod";

const ProviderSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  level: z.enum(["L1", "L2", "L3"]),
  rating: z.number().min(0).max(5),
  // ...
});

export function getProviders(): Provider[] {
  const result = z.array(ProviderSchema).safeParse(providers);
  if (!result.success) {
    console.error("Data validation failed:", result.error);
    return [];
  }
  return result.data;
}
```

---

### 2.5 表单与输入处理

#### ✅ 优点
- 蜜罐字段（honeypot）防机器人
- 防抖草稿保存（600ms）
- 提交冷却期（5秒防连点）

#### ⚠️ 问题与建议

**问题 I-1：缺少统一的输入消毒**

```typescript
// StaticForm.tsx 中直接使用用户输入
const payload = {
  company: formData.get("company") as string,
  painPoint: formData.get("painPoint") as string,
  // ...
};
```

用户输入直接拼接到通知文本中，虽然做了 `encodeURIComponent`，但缺少 XSS 过滤。

**建议**：引入简单的输入消毒函数：
```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // 移除尖括号
    .trim()
    .slice(0, 2000); // 长度限制
}
```

**问题 I-2：联系方式校验不完整**

手机号仅校验长度，未校验号段；邮箱校验正则不够严谨。

**建议**：
```typescript
function isValidPhone(phone: string): boolean {
  // 中国大陆手机号：1[3-9] 开头，11位
  return /^1[3-9]\d{9}$/.test(phone);
}

function isValidEmail(email: string): boolean {
  // 更严格的邮箱校验
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}
```

---

### 2.6 性能与优化

#### ⚠️ 问题与建议

**问题 P-1：图片未优化**

```typescript
// next.config.ts
images: { unoptimized: true }
```

所有图片无压缩、无 WebP/AVIF 转换、无响应式尺寸。

**建议**：
- 短期：使用 `next/image` 的 `unoptimized` 仅用于静态导出，手动压缩图片并使用 `<picture>` 提供 WebP 回退
- 长期：部署到支持图片优化的平台（Vercel、阿里云 CDN）

**问题 P-2：无代码分割优化**

`layout.tsx` 中直接导入所有全局组件：
```typescript
import { Footer } from "@/components/shared/Footer";
import { Navbar } from "@/components/shared/Navbar";
import { FloatingSupport } from "@/components/support/FloatingSupport";
```

`FloatingSupport` 是每个页面都加载的，但用户可能只需要在部分页面使用。

**建议**：使用 `dynamic import` 延迟加载非关键组件：
```typescript
import dynamic from "next/dynamic";

const FloatingSupport = dynamic(
  () => import("@/components/support/FloatingSupport"),
  { ssr: false }
);
```

**问题 P-3：字体加载策略**

```css
/* globals.css */
--font-sans: "Noto Sans SC", "PingFang SC", ...
--font-serif: "Noto Serif SC", "Songti SC", ...
```

移除了外部字体依赖是好事，但系统字体栈在不同平台渲染效果差异大。

**建议**：
- 使用 `font-display: swap` 避免 FOIT（Flash of Invisible Text）
- 如需更一致的体验，可引入子集化的中文字体（如阿里巴巴普惠体）

---

### 2.7 工程化与 DevOps

#### ✅ 优点
- Git 提交记录规范，有保存点概念
- npm scripts 完整：lint、build、verify、smoke、check:env

#### ⚠️ 问题与建议

**问题 E-1：缺少单元测试**

项目无任何测试文件（`.test.ts` 或 `.spec.ts`）。

**建议**：引入 Vitest + React Testing Library：
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

优先测试：
1. `lib/data.ts` 的数据过滤/排序函数
2. `lib/catalog.ts` 的匹配逻辑
3. `lib/auth.ts` 的校验函数
4. `relay/lead-relay.mjs` 的核心工具函数（可单独抽离测试）

**问题 E-2：缺少 CI/CD 配置**

无 GitHub Actions / GitLab CI 配置，每次提交无法自动验证。

**建议**：新增 `.github/workflows/ci.yml`：
```yaml
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run verify:data
      - run: npm run build
      - run: npm run smoke:routes
      - run: npm run relay:check
```

**问题 E-3：依赖版本锁定**

`package.json` 中使用 `^` 版本范围，长期可能导致依赖漂移。

**建议**：
- 启用 `package-lock.json`（已存在 ✅）
- CI 中使用 `npm ci` 而非 `npm install`
- 定期运行 `npm audit` 和 `npm outdated`

---

### 2.8 安全专项审查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| HTTPS 强制 | ⚠️ | 静态站需 CDN/托管平台配置 HSTS |
| XSS 防护 | ❌ | 无 Content-Security-Policy，输入未消毒 |
| CSRF 防护 | ⚠️ | Relay 有 Origin 校验，但前端表单无 CSRF Token |
| SQL 注入 | N/A | 暂无数据库连接 |
| 敏感信息泄露 | ⚠️ | `.env.example` 中示例密钥需明确标注 "CHANGE ME" |
| 点击劫持 | ❌ | 无 `X-Frame-Options` 或 CSP frame-ancestors |
| 密码存储 | ⚠️ | scrypt 正确，但仅在前端演示 |
| 会话管理 | ⚠️ | HMAC 签名正确，但默认密钥问题 |

**建议立即补充的安全头**：
```javascript
// relay/lead-relay.mjs 中 setCorsHeaders 之外增加：
response.setHeader("X-Content-Type-Options", "nosniff");
response.setHeader("X-Frame-Options", "DENY");
response.setHeader("X-XSS-Protection", "1; mode=block");
response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
```

---

## 三、团队技术提升计划

### 3.1 短期（1-2 周）

| 优先级 | 任务 | 负责人建议 | 验收标准 |
|--------|------|------------|----------|
| P0 | 修复 B-4（HMAC 默认密钥）| 后端开发 | relay 启动时无密钥直接退出 |
| P0 | 添加 A-1 演示系统提示 | 前端开发 | 登录/注册页有醒目提示文案 |
| P0 | 补充安全头 | 后端开发 | `/healthz` 响应头包含 4 个安全头 |
| P1 | 引入 Zod 数据校验 | 全栈开发 | `lib/data.ts` 使用 Zod 校验 JSON |
| P1 | 拆分 StaticForm 组件 | 前端开发 | 单文件行数 < 150 行 |
| P1 | 配置 GitHub Actions CI | 运维/全栈 | 每次 PR 自动跑 lint/build/verify |

### 3.2 中期（1-2 个月）

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P1 | 引入 Vitest 单元测试 | 核心工具函数覆盖率达到 70% |
| P1 | 接入真实数据库 | PostgreSQL + Prisma/TypeORM，替换内存存储 |
| P1 | 后端框架升级 | Express/Fastify + 路由模块化，替代单文件 relay |
| P2 | 图片优化 | 接入 CDN 图片处理或自研压缩脚本 |
| P2 | 引入 CSP 策略 | 配置 Content-Security-Policy 头 |
| P2 | 性能监控 | 接入 Web Vitals 监控或自研性能打点 |

### 3.3 长期（3-6 个月）

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P2 | 微服务拆分 | 认证服务、线索服务、支付服务独立部署 |
| P2 | 缓存层引入 | Redis 缓存热点数据（服务商列表、案例列表） |
| P2 | 日志与监控 | 接入 ELK/Loki + Prometheus 或云厂商方案 |
| P3 | E2E 测试 | Playwright 覆盖核心用户路径 |
| P3 | A/B 测试框架 | 首页 CTA、文案转化率实验 |

---

## 四、Code Review 规范建议

### 4.1 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

示例：
```
feat(auth): 添加手机号验证码登录

- 新增 /api/auth/code 和 /api/auth/session 接口
- 前端 AuthPanel 支持手机号和邮箱切换
- 验证码使用 HMAC 签名，TTL 5 分钟

Closes #42
```

### 4.2 Review 检查清单

- [ ] TypeScript 类型是否完整（无 `any`）
- [ ] 新函数是否有对应的单元测试
- [ ] 用户输入是否经过校验和消毒
- [ ] 敏感信息是否硬编码
- [ ] 错误处理是否完善（非仅 `console.log`）
- [ ] 新依赖是否必要（优先使用原生 API）
- [ ] 性能影响（大数据列表是否分页/虚拟滚动）

### 4.3 团队学习资源

| 主题 | 资源 | 优先级 |
|------|------|--------|
| TypeScript 高级类型 | 《Effective TypeScript》 | 高 |
| React 性能优化 | React 官方文档 — Performance | 高 |
| Node.js 安全 | OWASP Node.js Cheat Sheet | 高 |
| Next.js App Router | 官方文档 + Vercel 博客 | 中 |
| 密码学基础 | Node.js crypto 模块文档 | 中 |

---

## 五、总结

九章甄选项目在当前阶段（Demo/验证期）的代码质量是**合格的**，团队展现了良好的工程意识：TypeScript 严格模式、静态生成策略、零依赖后端、验证脚本链等都是有经验的选择。

但距离**生产级上线**还有以下关键差距：

1. **认证系统必须重建**：当前 localStorage 方案仅适合演示，正式上线前需要完整的后端认证（短信/邮箱/OAuth + JWT/Session + 数据库持久化）
2. **Relay 需要框架化**：单文件 1000+ 行的原生 HTTP 服务难以维护，建议迁移到 Express/Fastify 并做路由拆分
3. **测试覆盖率为 0**：必须引入单元测试和 E2E 测试，建立质量门禁
4. **安全基线需补齐**：CSP、安全头、XSS 过滤、密码复杂度等基础安全措施

建议团队按照「短期 → 中期 → 长期」计划逐步推进，不要试图一次性解决所有问题。当前最重要的是**验证商业模式**，技术架构在支撑业务验证的前提下逐步完善。

---

*评估人：资深开发工程师*  
*日期：2026-05-02*
