import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getCasesForService, getProvidersForService, serviceCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "AI 服务类型",
  description: "按 AI 自动化、电商视觉、内容生产和私有知识库等服务类型浏览九章甄选服务商与案例。"
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <SectionHeading title="AI 服务类型" description="先按业务要解决的问题进入二级页面，再查看可匹配的服务商、案例和验收关注点。" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {serviceCategories.map((category) => {
          const providers = getProvidersForService(category);
          const cases = getCasesForService(category);
          return (
            <Link key={category.slug} href={`/services/${category.slug}`} className="editorial-card rounded-2xl bg-white p-6">
              <p className="text-sm font-semibold text-[var(--color-brand)]">{category.shortTitle}</p>
              <h2 className="mt-2 text-2xl font-bold">{category.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{category.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {category.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
                    {tag}
                  </span>
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
