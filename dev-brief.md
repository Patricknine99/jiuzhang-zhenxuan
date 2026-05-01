# 九章甄选 — 前端开发交接文档

> 交付日期：2026-05-01  
> 接收方：AI 助手 + 架构师  
> 目标：基于本文档立即开始前端开发，无需再问产品问题

---

## 1. 项目一句话

**九章甄选** — AI 商业服务的严选平台。帮助企业发现、评估并对接经过真实商业验证的 AI 创作者与独立工作室。

---

## 2. 技术决策（已定，不要改）

| 决策 | 选择 | 原因 |
|------|------|------|
| 框架 | **Next.js (App Router)** | SSR 利于 SEO，生态成熟 |
| 样式 | **Tailwind CSS** | Demo 已用 Tailwind，保持一致性 |
| 数据源（v1.0） | **飞书多维表格 API** | 不上数据库，全部内容管理走飞书 |
| 表单 | **飞书表单嵌入 / API 提交** | 线索直接进飞书表格 |
| 部署 | **Vercel**（先）或阿里云 OSS 静态托管 | v1.0 纯静态站 |
| 组件库 | **无**。手写组件 | 保持编辑精选质感，不用 Ant Design |
| 字体 | Noto Serif SC（标题） + Noto Sans SC（正文） | Google Fonts CDN |

**核心架构原则**：v1.0 是纯静态站（SSG），所有内容从飞书 API 拉取构建。不上数据库，不写后端 API，不接支付。

---

## 3. 设计令牌（CSS Variables）

```css
:root {
  /* 品牌色 */
  --color-brand:        #C2410C;  /* 主色 — CTA、强调、链接 */
  --color-brand-hover:  #9A3412;  /* 悬停 */
  --color-brand-light:  #FEF3C7;  /* 浅色背景（标签） */

  /* 文字 */
  --color-text-primary:   #1C1917;  /* 标题 */
  --color-text-secondary: #57534E;  /* 正文 */
  --color-text-tertiary:  #78716C;  /* 辅助说明 */
  --color-text-muted:     #A8A29E;  /* 占位/禁用 */

  /* 背景 */
  --color-bg-primary:   #FAFAF9;  /* 页面背景 */
  --color-bg-secondary: #F5F5F4;  /* 卡片区背景 */
  --color-bg-white:     #FFFFFF;  /* 卡片 */

  /* 边框 */
  --color-border:       #E7E5E4;

  /* 认证等级 */
  --color-level-l1-bg:  #F5F5F4;
  --color-level-l1-text:#78716C;
  --color-level-l2-bg:  #FEF3C7;
  --color-level-l2-text:#92400E;
  --color-level-l3-bg:  #DCFCE7;
  --color-level-l3-text:#166534;

  /* 圆角 */
  --radius-card: 16px;
  --radius-btn:  12px;

  /* 间距 */
  --section-gap: 80px;  /* 大区块间距 */
}
```

---

## 4. 页面清单（9 页，全做）

### 现有文件
- `demo/index.html` — 首页 Demo（参考风格，不直接复用代码）

### 需新建的 Next.js 路由

| # | 路由 | 页面 | 类型 | 优先级 |
|---|------|------|------|--------|
| 1 | `/` | 首页 | SSG | P0 |
| 2 | `/providers` | 服务商列表 | SSG (ISR) | P0 |
| 3 | `/providers/[slug]` | 服务商详情 | SSG (ISR) | P0 |
| 4 | `/cases` | 案例库 | SSG (ISR) | P0 |
| 5 | `/cases/[slug]` | 案例详情 | SSG (ISR) | P0 |
| 6 | `/post-demand` | 发布需求 | 静态+飞书表单 | P0 |
| 7 | `/join` | 服务商入驻 | 静态+飞书表单 | P0 |
| 8 | `/sla` | 验收标准 | SSG（纯静态） | P1 |
| 9 | `/terms`, `/privacy`, `/provider-agreement` | 法律文档 | SSG（纯静态） | P1 |

---

## 5. 数据模型（飞书多维表格字段）

### 表 A：服务商 (providers)

```
slug             文本      URL 标识（如 "spark-ai-studio"）
name             文本      服务商名称
level            单选      L1-平台初筛 / L2-商业验证 / L3-企业合伙人
tags             多选      企业知识库, 客服Agent, 自动化流程, 商品图, 短视频...
industry         多选      教育, 电商, 咨询, 跨境电商, MCN, 制造, 法律, 财税...
delivery_min     数字      最短交付天数
delivery_max     数字      最长交付天数
budget_min       数字      最低预算（元）
budget_max       数字      最高预算（元）
rating           数字      评分（1-5）
case_count       数字      交付案例数
avatar_url       文本      头像/Logo URL
description      多行文本  一句话介绍
tech_stack       多行文本  技术栈
can_invoice      复选框    是否可开票
featured         复选框    是否首页精选展示
sort_order       数字      排序权重
```

### 表 B：案例 (cases)

```
slug             文本      URL 标识
title            文本      案例标题
provider_slug    文本      关联服务商 slug
provider_name    文本      服务商名称（冗余，方便展示）
category         单选      电商视觉 / 企业AI / 内容创作 / 自动化流程
industry         多选      行业
problem          多行文本  企业痛点
solution         多行文本  AI 解决方案
roi_text         文本      可量化效果（如"单张成本↓85%"）
budget_text      文本      预算（如"约 ¥15,000"）
ai_label         文本      AI 标识（固定"含 AI 生成内容标识"）
featured         复选框    是否首页精选展示
sort_order       数字      排序权重
```

### 表 C：需求线索 (demands)

```
company          文本      公司名称
contact_name     文本      联系人
industry         单选      行业
pain_point       多行文本  业务痛点
budget_range     单选      <5千 / 5千-2万 / 2-5万 / 5万+
expected_delivery 单选     <1周 / 1-4周 / 1-3月 / 不紧急
need_recommend   复选框    是否需要平台推荐
phone            文本      手机号
wechat           文本      微信号
created_at       日期      提交时间
```

### 表 D：入驻申请 (applications)

```
team_name        文本      团队/个人名称
direction        多选      擅长方向
case_links       多行文本  已有案例链接（≥3个）
tech_stack       多行文本  技术栈
budget_range     单选      可接预算区间
can_invoice      复选框    是否可开票
contact_phone    文本      手机号
contact_wechat   文本      微信号
created_at       日期      提交时间
```

---

## 6. 页面级详细规格

### 6.1 首页 `/`

**参考文件**：`demo/index.html`（风格参考，用 Next.js 重写）

**区块（从上到下）**：
1. **导航栏**：Logo + 找服务商/商业案例/验收标准 + 服务商入驻 + 发布需求按钮
2. **Hero**：痛点标题 + 双 CTA + 信任数字条（27 项目 / -60% 时间 / 0 纠纷）
3. **三步流程**：发需求 → 诊断匹配 → 担保交付
4. **精选服务商**：3-6 张卡片（从飞书 `featured=true` 拉取）
5. **案例深度展示**：2 个精选案例（从飞书 `featured=true` 拉取）
6. **信任基础设施**：资金托管 / SLA / 认证 三列
7. **双端入口**：企业端 vs 创作者端
8. **底部 CTA**：需求诊断
9. **Footer**：版权 + 法律链接

**组件拆分建议**：
```
components/
  layout/
    Navbar.tsx
    Footer.tsx
  home/
    HeroSection.tsx
    TrustBar.tsx
    HowItWorks.tsx
    FeaturedProviders.tsx
    FeaturedCases.tsx
    TrustInfra.tsx
    DualCTA.tsx
    BottomCTA.tsx
  shared/
    ProviderCard.tsx
    CaseCard.tsx
    LevelBadge.tsx
    SectionHeading.tsx
```

### 6.2 服务商列表 `/providers`

**功能**：
- 顶部筛选栏：认证等级（L1/L2/L3 多选）、行业（多选）、预算区间（单选）、交付周期（单选）
- 排序：默认等级+评分降序
- 3 列卡片网格（桌面端）
- 卡片内容：名称、等级徽章、标签、行业、周期、预算、评分、案例数
- 点击卡片进入详情页

**状态**：
- 加载态：卡片骨架屏（6 个占位卡）
- 空态：「暂无匹配的服务商，试试放宽筛选条件」
- 错误态：「加载失败，点击重试」

### 6.3 服务商详情 `/providers/[slug]`

**内容**：
- Hero 区：名称 + 等级徽章 + 一句话介绍
- 核心指标行：评分 / 交付案例数 / 响应时间 / 可开票
- 擅长方向标签
- 技术栈
- 预算区间 + 交付周期
- 代表案例列表（卡片，可点击跳案例详情）
- 客户评价（评分+文字）
- 底部 CTA：「咨询此服务商」→ 跳 `/post-demand?provider=xxx`

**状态**：
- 404：「服务商不存在或已下架」
- 加载态：骨架屏

### 6.4 案例库 `/cases`

**功能**：
- 筛选：行业、服务类型
- 2 列卡片布局（桌面端）
- 每张卡片：标题、服务商、行业、场景标签、ROI 摘要、预算
- 点击进入详情

### 6.5 案例详情 `/cases/[slug]`

**内容（商业叙事结构，非填表）**：
1. 行业场景标签
2. 标题
3. 企业背景（1-2 句）
4. 痛点（扩写）
5. 方案拆解（扩写）
6. 交付过程简述
7. 可量化效果（大字突出）
8. 预算
9. 服务商信息 + 「索取此方案报价」CTA
10. AI 标识（角标，合规强制）

**配色**：深色底（`#1C1917`）+ 暖色强调，营造「精品案例」质感，参考 demo/index.html 案例区。

### 6.6 发布需求 `/post-demand`

**表单字段**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 公司名称 | text | 是 | |
| 联系人 | text | 是 | |
| 所属行业 | select | 是 | 电商/教育/外贸/本地生活/文旅/法律/财税/MCN/游戏/广告/制造/其他 |
| 业务痛点 | textarea | 是 | placeholder：「描述你想用 AI 解决什么问题，越具体越好」 |
| 预算区间 | radio | 是 | <5千 / 5千-2万 / 2-5万 / 5万+ / 未确定 |
| 期望交付 | radio | 是 | <1周 / 1-4周 / 1-3月 / 不紧急 |
| 需要推荐服务商 | checkbox | 否 | 默认勾选 |
| 手机号 | tel | 否 | |
| 微信号 | text | 否 | |

**提交流程**：
1. 用户填写 → 点击「提交需求」
2. 前端验证 → 调飞书 API 写入表 C
3. 跳转确认页：
   ```
   ✅ 需求已提交
   平台产品经理将在 24 小时内联系您
   如需紧急沟通，请加微信：xxx
   ```

### 6.7 服务商入驻 `/join`

**表单字段**：
| 字段 | 类型 | 必填 |
|------|------|------|
| 团队/个人名称 | text | 是 |
| 擅长方向 | checkbox 多选 | 是 |
| 已有案例链接 | textarea | 是（≥3个） |
| 技术栈 | textarea | 是 |
| 可接预算区间 | radio | 是 |
| 是否可开票 | radio | 是/否 |
| 手机号 | tel | 是 |
| 微信号 | text | 否 |

**页面文案**（重要）：
- 标题：「申请成为精选服务商」
- 副标题：「平台会根据真实案例、交付能力、行业适配度进行初步筛选，3 个工作日内邮件通知审核结果」
- **不要写「免费入驻」**

**提交流程**：同发布需求，写入飞书表 D。

### 6.8 验收标准 `/sla`

纯静态长文页。内容大纲：
1. 为什么 AI 项目需要验收标准
2. 模型输出容错率说明
3. 响应时间 SLA
4. 系统边界定义
5. 返工与变更处理
6. 验收流程与节点

### 6.9 法律文档

三页纯静态：
- `/terms` — 用户服务协议
- `/privacy` — 隐私政策
- `/provider-agreement` — 服务商入驻协议

内容待补充（法律顾问起草）。先做页面框架，内容放占位符。

---

## 7. 共享组件清单

```
components/shared/
├── Navbar.tsx             导航栏（全站共用）
├── Footer.tsx             页脚（全站共用）
├── ProviderCard.tsx       服务商卡片（首页/列表复用）
├── CaseCard.tsx           案例卡片（首页/列表复用）
├── CaseCardDark.tsx       案例卡片深色版（首页专用）
├── LevelBadge.tsx         认证等级徽章
├── SectionHeading.tsx     区块标题（accent line + 标题 + 副标题）
├── Skeleton.tsx           骨架屏
├── EmptyState.tsx         空态占位
├── FilterBar.tsx          筛选栏
└── SEO.tsx                Meta tags 封装
```

---

## 8. 全局布局

```
app/
├── layout.tsx             根布局（Navbar + children + Footer）
├── page.tsx               首页
├── providers/
│   ├── page.tsx           服务商列表
│   └── [slug]/
│       └── page.tsx       服务商详情
├── cases/
│   ├── page.tsx           案例库
│   └── [slug]/
│       └── page.tsx       案例详情
├── post-demand/
│   ├── page.tsx           发布需求表单
│   └── success/
│       └── page.tsx       提交确认页
├── join/
│   ├── page.tsx           入驻申请表单
│   └── success/
│       └── page.tsx       提交确认页
├── sla/
│   └── page.tsx           验收标准
├── terms/
│   └── page.tsx           用户协议
├── privacy/
│   └── page.tsx           隐私政策
└── provider-agreement/
    └── page.tsx           服务商协议
```

---

## 9. 飞书集成要点

v1.0 不写数据库。所有内容从飞书读取，表单写入飞书。

**读取（构建时）**：
- 在 `getStaticProps` 或 Next.js App Router 的 `fetch` 中调飞书 API
- 或构建脚本从飞书导出 JSON，放进 `/data/providers.json` 和 `/data/cases.json`

**推荐方案（最低成本）**：
```
/data/
├── providers.json    ← 从飞书手动导出 or 构建脚本拉取
└── cases.json        ← 同上
```
- 新增服务商/案例 → 飞书表格添加行 → 重新导出 JSON → 重新构建部署
- 适合低频更新（v1.0 完全够用）

**写入（表单提交）**：
- 前端 POST 到飞书 API → 写入需求表/入驻表
- 或用飞书表单 iframe 嵌入（更简单，但样式不统一）

---

## 10. SEO 要求

每个页面必须包含：
```tsx
<title>页面标题 | 九章甄选</title>
<meta name="description" content="页面描述（120-160字）" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="/og-image.png" />
```

路由结构示例：
- `/providers` → title: "AI 服务商精选库 | 九章甄选"
- `/cases/cross-border-ecommerce-ai-images` → title: "跨境电商 AI 商品图自动化 — 案例拆解 | 九章甄选"

---

## 11. 开发顺序（建议）

```
Phase 1（第 1 天）
  ├── Next.js 项目初始化 + Tailwind 配置 + 设计令牌
  ├── 全局 Layout（Navbar + Footer）
  ├── 首页（全部区块）
  └── 共享组件（ProviderCard, CaseCard, LevelBadge, SectionHeading）

Phase 2（第 2 天）
  ├── 服务商列表 + 详情页
  ├── 案例库 + 案例详情页
  └── 数据层（providers.json + cases.json）

Phase 3（第 3 天）
  ├── 发布需求表单 + 确认页
  ├── 服务商入驻表单 + 确认页
  └── 飞书 API 对接

Phase 4（第 4 天）
  ├── 验收标准页
  ├── 法律文档页（占位）
  ├── 骨架屏 / 空态 / 错误态
  └── SEO meta 补全 + 移动端适配
```

---

## 12. 参考文件

- `demo/index.html` — 首页 Demo（风格参考，不要直接 copy 代码）
- `spec.md` — 完整产品规格（含商业模式、竞品、合规）
- 原始策划文档：`/Users/nine9jiu/Documents/New project/ai-creator-marketplace-plan.md`

---

## 13. 不要做的事

- ❌ 不要上数据库（v1.0 纯静态）
- ❌ 不要写后端 API
- ❌ 不要接支付/登陆系统
- ❌ 不要用 Ant Design 等重型组件库（破坏编辑精选质感）
- ❌ 不要做用户注册/个人中心
- ❌ 不要做管理后台（飞书表格就是后台）
- ❌ 不要用 Indigo/Blue 配色（用文档中的暖铜色系统）

---

**此文档即为开发的唯一真相来源。有疑问先查本文档，本文档未覆盖的问题再问产品方。**
