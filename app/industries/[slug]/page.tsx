import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CaseCard } from "@/components/shared/CaseCard";
import { ProviderCard } from "@/components/shared/ProviderCard";
import {
  getCasesForIndustry,
  getIndustryCategory,
  getProvidersForIndustry,
  industryCategories
} from "@/lib/catalog";

export function generateStaticParams() {
  return industryCategories.map((category) => ({ slug: category.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getIndustryCategory(slug);
  if (!category) return {};
  return {
    title: `${category.title} AI 服务`,
    description: category.description
  };
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getIndustryCategory(slug);
  if (!category) notFound();
  const providers = getProvidersForIndustry(category);
  const cases = getCasesForIndustry(category);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <section className="rounded-3xl bg-stone-950 p-8 text-white md:p-10">
        <p className="text-sm font-semibold text-orange-200">行业入口</p>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">{category.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-300">{category.description}</p>
        <Link
          href={`/post-demand?industry=${category.slug}`}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)]"
        >
          发布此行业需求 <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {category.painPoints.map((point) => (
          <div key={point} className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
            <p className="text-xs font-semibold text-stone-400">常见痛点</p>
            <p className="mt-2 font-semibold text-stone-800">{point}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-bold">适配服务商</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.slug} provider={provider} />
          ))}
        </div>
      </section>

      {cases.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl font-bold">行业案例</h2>
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
