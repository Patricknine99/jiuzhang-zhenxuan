import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getCasesForIndustry, getProvidersForIndustry, industryCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "行业解决方案",
  description: "按电商、教育咨询、本地生活和专业服务等行业浏览九章甄选匹配的 AI 服务商与案例。"
};

export default function IndustriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <SectionHeading title="行业解决方案" description="先选行业，再查看该行业下已验证的 AI 服务商、案例和常见痛点。" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {industryCategories.map((category) => {
          const providers = getProvidersForIndustry(category);
          const cases = getCasesForIndustry(category);
          return (
            <Link key={category.slug} href={`/industries/${category.slug}`} className="editorial-card rounded-2xl bg-white p-6">
              <p className="text-sm font-semibold text-[var(--color-brand)]">行业方案</p>
              <h2 className="mt-2 text-2xl font-bold">{category.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{category.description}</p>
              <div className="mt-5 space-y-1.5">
                {category.painPoints.map((pain) => (
                  <p key={pain} className="text-xs text-stone-500">· {pain}</p>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4 text-sm text-stone-500">
                <span>
                  {providers.length} 家服务商 · {cases.length} 个案例
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-brand)]">
                  进入二级页 <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
