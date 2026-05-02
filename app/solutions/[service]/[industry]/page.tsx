import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ClipboardList } from "lucide-react";
import { CaseCard } from "@/components/shared/CaseCard";
import { ProviderCard } from "@/components/shared/ProviderCard";
import {
  getCasesForSolution,
  getProvidersForSolution,
  getSolutionCategory,
  industryCategories,
  serviceCategories
} from "@/lib/catalog";

export function generateStaticParams() {
  return serviceCategories.flatMap((service) =>
    industryCategories.map((industry) => ({
      service: service.slug,
      industry: industry.slug
    }))
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params
}: {
  params: Promise<{ service: string; industry: string }>;
}): Promise<Metadata> {
  const { service: serviceSlug, industry: industrySlug } = await params;
  const solution = getSolutionCategory(serviceSlug, industrySlug);
  if (!solution) return {};
  return {
    title: `${solution.industry.title}${solution.service.shortTitle}方案`,
    description: `${solution.industry.title}场景下的${solution.service.title}服务商、案例和验收重点。`
  };
}

export default async function SolutionDetailPage({ params }: { params: Promise<{ service: string; industry: string }> }) {
  const { service: serviceSlug, industry: industrySlug } = await params;
  const solution = getSolutionCategory(serviceSlug, industrySlug);
  if (!solution) notFound();
  const { service, industry } = solution;
  const providers = getProvidersForSolution(service, industry);
  const cases = getCasesForSolution(service, industry);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <section className="bg-white p-8 ring-1 ring-stone-200 md:p-10">
        <p className="text-sm font-semibold text-[var(--color-brand)]">三级方案页</p>
        <div className="mt-3 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="text-3xl font-bold md:text-5xl">
              {industry.title} × {service.shortTitle}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-600">
              {industry.description} 本页进一步收窄到「{service.title}」，用于承接从二级菜单进入后的具体采购判断。
            </p>
          </div>
          <Link
            href={`/post-demand?service=${service.slug}&industry=${industry.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            提交此方案需求 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[...industry.painPoints.slice(0, 2), ...service.outcomes.slice(0, 1)].map((item) => (
          <div key={item} className="rounded-2xl bg-stone-100 p-5">
            <ClipboardList className="mb-3 h-5 w-5 text-[var(--color-brand)]" />
            <p className="font-semibold text-stone-800">{item}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold">优先匹配服务商</h2>
        {providers.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard key={provider.slug} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 text-sm leading-7 text-stone-600">
            当前样例数据中暂无同时命中该行业和服务类型的服务商。提交需求后，平台可按人工甄选流程补充匹配。
          </div>
        )}
      </section>

      {cases.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-bold">相关案例</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {cases.map((caseStudy) => (
              <CaseCard key={caseStudy.slug} caseStudy={caseStudy} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
