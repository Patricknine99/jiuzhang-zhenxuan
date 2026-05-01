import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { CaseCard } from "@/components/shared/CaseCard";
import { ProviderCard } from "@/components/shared/ProviderCard";
import {
  getCasesForService,
  getProvidersForService,
  getServiceCategory,
  serviceCategories
} from "@/lib/catalog";

export function generateStaticParams() {
  return serviceCategories.map((category) => ({ slug: category.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getServiceCategory(slug);
  if (!category) return {};
  return {
    title: `${category.title}服务`,
    description: category.description
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getServiceCategory(slug);
  if (!category) notFound();
  const providers = getProvidersForService(category);
  const cases = getCasesForService(category);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <section className="rounded-3xl bg-white p-8 ring-1 ring-stone-200 md:p-10">
        <p className="text-sm font-semibold text-[var(--color-brand)]">服务类型</p>
        <div className="mt-3 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="text-3xl font-bold md:text-5xl">{category.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-600">{category.description}</p>
          </div>
          <Link
            href={`/post-demand?service=${category.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            咨询此类服务 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {category.outcomes.map((outcome) => (
          <div key={outcome} className="rounded-2xl bg-stone-100 p-5">
            <ClipboardCheck className="mb-3 h-5 w-5 text-[var(--color-brand)]" />
            <p className="font-semibold text-stone-800">{outcome}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">匹配服务商</h2>
            <p className="mt-2 text-sm text-stone-500">按标签和交付方向匹配，后续可接入真实排序权重。</p>
          </div>
          <Link href="/providers" className="text-sm font-semibold text-[var(--color-brand)]">
            查看全部
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.slug} provider={provider} />
          ))}
        </div>
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
