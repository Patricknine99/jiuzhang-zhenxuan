import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, ClipboardList, FileCheck2, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "供给方入口",
  description: "面向 AI 创作者、独立工作室和 OPC 的服务商认证、案例包装、接单与商业交付入口。"
};

export default function CreatorsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-6 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--color-brand)]">供给方入口</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">
              把 AI 能力包装成企业愿意采购的服务
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              适合 AI 创作者、独立工作室、OPC 和自动化顾问。平台关注的不是单张作品，而是真实案例、报价边界、响应 SLA、版权声明和可复用交付流程。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=provider" className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-6 py-3.5 font-semibold text-stone-700 hover:bg-white">
                <BriefcaseBusiness className="h-5 w-5" />
                创建供给方账号
              </Link>
              <Link href="/join" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)]">
                <Sparkles className="h-5 w-5" />
                申请成为精选服务商
              </Link>
              <Link href="/provider-agreement" className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-6 py-3.5 font-semibold text-stone-700 hover:bg-white">
                <FileCheck2 className="h-5 w-5" />
                查看服务商协议
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-sm font-semibold text-stone-400">入驻审核看什么</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["3 个以上商业案例", "明确可交付服务包", "预算与周期边界", "可开票/NDA/版权承诺", "48-72h 响应能力", "复盘与客户评价"].map((item) => (
                <div key={item} className="rounded-xl bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <SectionHeading title="服务商成长路径" description="先做可信展示，再接真实需求，最后沉淀平台信用资产。" align="center" />
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {[
              [ClipboardList, "提交资料", "团队信息、案例链接、技术栈和预算区间。"],
              [BadgeCheck, "平台初筛", "按案例真实性、商业结果和交付边界评估。"],
              [BriefcaseBusiness, "匹配需求", "进入候选短名单，按适配度推荐给需求方。"],
              [FileCheck2, "沉淀信用", "交易评价、响应记录和案例复盘进入认证体系。"]
            ].map(([Icon, title, text]) => (
              <div key={title as string} className="rounded-xl border border-stone-200 p-5">
                <Icon className="h-5 w-5 text-[var(--color-brand)]" />
                <h2 className="mt-4 font-bold">{title as string}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">{text as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 md:px-6 md:py-20">
        <div className="rounded-2xl bg-stone-950 p-8 text-stone-100 md:p-10">
          <p className="text-sm font-semibold text-orange-300">不是所有创作者都适合入驻</p>
          <h2 className="mt-3 text-2xl font-bold md:text-3xl">九章甄选优先收录能对企业结果负责的 AI 服务商</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["不只展示作品", "需要说明客户背景、问题、方案、过程、预算和效果。"],
              ["不靠低价竞标", "需要明确可交付范围、返工边界和验收方式。"],
              ["不隐藏工具链", "需要声明模型、素材、数据集和版权风险。"]
            ].map(([title, text]) => (
              <div key={title} className="rounded-xl border border-stone-800 p-5">
                <h3 className="font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-400">{text}</p>
              </div>
            ))}
          </div>
          <Link href="/join" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-stone-950 hover:bg-amber-50">
            提交入驻申请 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
