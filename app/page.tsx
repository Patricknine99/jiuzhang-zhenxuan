import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardCheck, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { CaseCardDark } from "@/components/shared/CaseCardDark";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getFeaturedCases, getFeaturedProviders } from "@/lib/data";

export default function HomePage() {
  const providers = getFeaturedProviders();
  const cases = getFeaturedCases();

  return (
    <>
      <section className="mx-auto max-w-4xl px-5 pb-16 pt-20 text-center md:px-6 md:pb-20 md:pt-28">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
          AI 商业服务的严选平台
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-normal md:text-5xl">
          想用 AI 做业务，但<span className="hero-pain">不知道该找谁、花多少钱、怎么验收？</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-600 md:text-xl">
          九章甄选只推荐经过真实商业验证的 AI 创作者与独立工作室。每一笔交付都有资金担保与标准验收。
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/diagnosis"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-8 py-4 font-semibold text-white shadow-lg shadow-orange-900/20 hover:bg-[var(--color-brand-hover)]"
          >
            <Search className="h-5 w-5" />
            免费发布 AI 需求诊断
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-8 py-4 font-semibold text-stone-700 hover:border-stone-400 hover:bg-white"
          >
            <Sparkles className="h-5 w-5" />
            浏览 AI 服务类型
          </Link>
          <Link
            href="/join"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-8 py-4 font-semibold text-stone-700 hover:border-stone-400 hover:bg-white"
          >
            <Users className="h-5 w-5" />
            申请成为精选服务商
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-stone-500">
          <span>
            已交付 <strong className="text-stone-950">27</strong> 个商业项目
          </span>
          <span>
            企业选型耗时 <strong className="text-stone-950">-60%</strong>
          </span>
          <span>
            资金纠纷 <strong className="text-stone-950">0 起</strong>
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 md:px-6 md:py-20">
        <SectionHeading title="从需求到交付，只需三步" description="平台帮你完成筛选、诊断与担保，让 AI 项目从一开始就有边界。" align="center" />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            ["01", "发布需求", "用 2 分钟填写业务痛点与预算，平台产品经理对接。"],
            ["02", "诊断匹配", "将模糊想法翻译成技术方案，匹配 2-3 家验证服务商。"],
            ["03", "担保交付", "按里程碑释放资金，提供验收模板与 SLA 兜底。"]
          ].map(([number, title, text]) => (
            <div key={number} className="text-center">
              <div className="font-serif text-6xl font-black text-stone-200">{number}</div>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-stone-200 px-5 py-16 md:px-6 md:py-20">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeading title="精选 AI 服务商" description="每一个都经过平台商业交付验证。" />
          <Link href="/providers" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)]">
            查看全部服务商 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.slug} provider={provider} />
          ))}
        </div>
      </section>

      <section className="bg-stone-950 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <SectionHeading title="商业案例深度拆解" description="不是作品秀，是真实的商业交付复盘。" align="center" dark />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {cases.map((caseStudy) => (
              <CaseCardDark key={caseStudy.slug} caseStudy={caseStudy} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/cases" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-300">
              查看全部案例 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-6 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [ShieldCheck, "资金节点托管", "按需求确认、Demo 验收、系统上线、最终交付四个节点分批释放。"],
            [ClipboardCheck, "标准验收协议", "明确容错率、响应时间与交付边界，从合同源头减少无休止返工。"],
            [BadgeCheck, "三级认证体系", "平台初筛、商业验证、企业合伙人，每一级都基于真实交付数据。"]
          ].map(([Icon, title, text]) => (
            <div key={title as string} className="editorial-card rounded-2xl bg-white p-8">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-[var(--color-brand)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">{title as string}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-500">{text as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-stone-200 px-5 py-14 md:px-6">
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--color-brand)]">交付稳定性</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">线索进入后端中转，再分发到业务渠道</h2>
            <p className="mt-4 leading-8 text-stone-600">
              当前版本保留数据库接口空位，先通过独立 relay 完成飞书、企业微信、钉钉分发，并提供健康检查、限流、超时和请求编号。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["/healthz 健康检查", "请求限流保护", "8 秒渠道超时", "数据库接口预留"].map((item) => (
              <div key={item} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-100 py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 md:grid-cols-2 md:px-6">
          <AudienceCard
            eyebrow="面向企业 / 品牌方 / 中小商家"
            title="我需要 AI 解决方案"
            text="告诉我们你的业务痛点与预算，平台帮你筛选匹配 2-3 家经过商业验证的服务商。"
            href="/diagnosis"
            action="免费诊断需求"
            icon="search"
          />
          <AudienceCard
            eyebrow="面向 AI 创作者 / 工作室 / OPC"
            title="我是 AI 服务商"
            text="加入九章甄选，平台帮你做商业包装，对接真实企业需求。"
            href="/join"
            action="申请成为精选服务商"
            icon="sparkles"
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 text-center md:px-6">
        <div className="accent-line mx-auto mb-6" />
        <h2 className="text-2xl font-bold md:text-3xl">还不知道该找谁？不知道预算怎么定？</h2>
        <p className="mt-4 text-lg leading-8 text-stone-600">
          把业务痛点告诉我们。平台产品经理帮你拆解需求、预估报价，并匹配合适的验证服务商。
        </p>
        <Link
          href="/diagnosis"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-9 py-4 text-lg font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-[var(--color-brand-hover)]"
        >
          开始免费需求诊断 <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </>
  );
}

function AudienceCard({
  eyebrow,
  title,
  text,
  href,
  action,
  icon
}: {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  action: string;
  icon: "search" | "sparkles";
}) {
  const Icon = icon === "search" ? Search : Sparkles;
  return (
    <div className="editorial-card rounded-2xl bg-white p-8 md:p-10">
      <p className="text-sm font-semibold text-[var(--color-brand)]">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-bold">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-stone-500">{text}</p>
      <Link
        href={href}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3.5 text-sm font-semibold hover:border-stone-400 hover:bg-stone-50"
      >
        <Icon className="h-4 w-4" />
        {action}
      </Link>
    </div>
  );
}
