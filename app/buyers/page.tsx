import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, Search, ShieldCheck, WalletCards } from "lucide-react";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getFeaturedProviders } from "@/lib/data";

export const metadata: Metadata = {
  title: "需求方入口",
  description: "面向企业、品牌方和中小商家的 AI 需求诊断、服务商匹配、预算预估和验收托管入口。"
};

export default function BuyersPage() {
  const providers = getFeaturedProviders().slice(0, 3);

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-6 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--color-brand)]">需求方入口</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">
              从一句业务问题开始，找到能交付的 AI 服务商
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              适合企业、品牌方、中小商家。你不需要先懂模型、工具和技术栈，只需要说清楚业务目标、预算和时间，平台会帮你拆解需求、匹配服务商并给出验收边界。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/diagnosis" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)]">
                <Search className="h-5 w-5" />
                先做 AI 需求诊断
              </Link>
              <Link href="/post-demand" className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-6 py-3.5 font-semibold text-stone-700 hover:bg-white">
                <FileText className="h-5 w-5" />
                直接发布需求
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-sm font-semibold text-stone-400">需求方会得到什么</p>
            <div className="mt-5 space-y-4">
              {[
                ["需求翻译", "把“想用 AI 提效”拆成可报价、可排期、可验收的任务。"],
                ["服务商短名单", "按行业、预算、案例和响应 SLA 推荐 2-3 个候选。"],
                ["交付边界", "提前确认数据、素材、模型版权、返工次数和验收口径。"]
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl bg-stone-50 p-4">
                  <h2 className="font-semibold text-stone-950">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-stone-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-4 md:px-6">
          {[
            [Search, "诊断", "梳理业务目标"],
            [ClipboardCheck, "匹配", "推荐验证服务商"],
            [WalletCards, "托管", "按里程碑付款"],
            [ShieldCheck, "验收", "SLA 与交付边界"]
          ].map(([Icon, title, text]) => (
            <div key={title as string} className="rounded-xl border border-stone-200 p-5">
              <Icon className="h-5 w-5 text-[var(--color-brand)]" />
              <h2 className="mt-4 font-bold">{title as string}</h2>
              <p className="mt-1 text-sm text-stone-500">{text as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-6 md:py-20">
        <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading title="可先查看的服务商样例" description="需求方不用从空白开始，可以先按行业、服务类型和预算范围建立预期。" />
          <Link href="/providers" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)]">
            浏览全部服务商 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.slug} provider={provider} />
          ))}
        </div>
      </section>
    </>
  );
}
