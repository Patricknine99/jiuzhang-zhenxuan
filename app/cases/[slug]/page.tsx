import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { getCase, getCases, getProvider } from "@/lib/data";

export function generateStaticParams() {
  return getCases().map((caseStudy) => ({ slug: caseStudy.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCase(slug);
  if (!caseStudy) return {};
  return {
    title: `${caseStudy.title} — 案例拆解`,
    description: `${caseStudy.title}：${caseStudy.roiText}，预算 ${caseStudy.budgetText}。`
  };
}

export default async function CaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = getCase(slug);
  if (!caseStudy) notFound();
  const provider = getProvider(caseStudy.providerSlug);

  return (
    <article className="bg-stone-950 text-stone-100">
      <div className="mx-auto max-w-5xl px-5 py-14 md:px-6 md:py-20">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded bg-orange-300/15 px-3 py-1.5 text-sm font-semibold text-orange-200">{caseStudy.category}</span>
          {caseStudy.industry.map((item) => (
            <span key={item} className="rounded bg-white/10 px-3 py-1.5 text-sm text-stone-300">
              {item}
            </span>
          ))}
        </div>
        <h1 className="max-w-4xl text-3xl font-bold leading-tight md:text-5xl">{caseStudy.title}</h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-stone-300">
            <BadgeCheck className="h-4 w-4 text-orange-200" />
            {caseStudy.aiLabel}
          </span>
          <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-stone-300">服务商：{caseStudy.providerName}</span>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <NarrativeBlock title="企业背景" text={caseStudy.background} />
            <NarrativeBlock title="痛点" text={caseStudy.problem} />
            <NarrativeBlock title="方案拆解" text={caseStudy.solution} />
            <NarrativeBlock title="交付过程" text={caseStudy.process} />
          </div>
          <aside className="h-fit rounded-2xl bg-white p-6 text-stone-950">
            <p className="text-xs text-stone-400">可量化效果</p>
            <p className="mt-2 text-2xl font-black text-[var(--color-brand)]">{caseStudy.roiText}</p>
            <div className="my-6 border-t border-stone-100" />
            <p className="text-xs text-stone-400">实施预算</p>
            <p className="mt-2 text-xl font-bold">{caseStudy.budgetText}</p>
            {provider ? (
              <Link
                href={`/providers/${provider.slug}`}
                className="mt-6 block rounded-xl bg-stone-100 p-4 text-sm font-semibold hover:bg-stone-200"
              >
                查看服务商：{provider.name}
              </Link>
            ) : null}
            <Link
              href={`/post-demand?case=${caseStudy.slug}`}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]"
            >
              索取此方案报价 <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </div>
    </article>
  );
}

function NarrativeBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
      <h2 className="text-xl font-bold text-orange-200">{title}</h2>
      <p className="mt-4 text-base leading-8 text-stone-300">{text}</p>
    </section>
  );
}
