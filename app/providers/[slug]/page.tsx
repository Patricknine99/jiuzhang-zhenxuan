import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileCheck, ReceiptText, Star } from "lucide-react";
import { CaseCard } from "@/components/shared/CaseCard";
import { LevelBadge } from "@/components/shared/LevelBadge";
import { formatCurrencyRange, getCasesByProvider, getProvider, getProviders } from "@/lib/data";

export function generateStaticParams() {
  return getProviders().map((provider) => ({ slug: provider.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const provider = getProvider(slug);
  if (!provider) return {};
  return {
    title: `${provider.name} — AI 服务商详情`,
    description: `${provider.name}：${provider.description}`
  };
}

export default async function ProviderDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const provider = getProvider(slug);
  if (!provider) notFound();
  const cases = getCasesByProvider(provider.slug);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <section className="rounded-3xl bg-white p-8 ring-1 ring-stone-200 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <LevelBadge level={provider.level} label={provider.levelLabel} />
            <h1 className="mt-5 text-3xl font-bold md:text-5xl">{provider.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">{provider.description}</p>
          </div>
          <Link
            href={`/post-demand?provider=${provider.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            咨询此服务商 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 border-t border-stone-100 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<Star className="h-5 w-5" />} label="评分" value={provider.rating.toFixed(1)} />
          <Metric icon={<FileCheck className="h-5 w-5" />} label="交付案例" value={`${provider.caseCount} 个`} />
          <Metric icon={<ArrowRight className="h-5 w-5" />} label="响应时间" value={provider.responseTime} />
          <Metric icon={<ReceiptText className="h-5 w-5" />} label="开票能力" value={provider.canInvoice ? "可开票" : "需沟通"} />
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <InfoBlock title="擅长方向">
            <div className="flex flex-wrap gap-2">
              {provider.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800">
                  {tag}
                </span>
              ))}
            </div>
          </InfoBlock>
          <InfoBlock title="技术栈">
            <div className="flex flex-wrap gap-2">
              {provider.techStack.map((item) => (
                <span key={item} className="rounded-full bg-stone-100 px-3 py-1.5 text-sm text-stone-600">
                  {item}
                </span>
              ))}
            </div>
          </InfoBlock>
          <InfoBlock title="代表案例">
            {cases.length > 0 ? (
              <div className="grid gap-5">
                {cases.map((caseStudy) => (
                  <CaseCard key={caseStudy.slug} caseStudy={caseStudy} />
                ))}
              </div>
            ) : (
              <p className="text-stone-500">代表案例正在整理中。</p>
            )}
          </InfoBlock>
        </div>
        <aside className="space-y-6">
          <InfoBlock title="报价与周期">
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">预算区间</dt>
                <dd className="font-bold text-[var(--color-brand)]">{formatCurrencyRange(provider.budgetMin, provider.budgetMax)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">交付周期</dt>
                <dd className="font-semibold text-stone-800">
                  {provider.deliveryMin} - {provider.deliveryMax} 天
                </dd>
              </div>
            </dl>
          </InfoBlock>
          <InfoBlock title="可交付服务">
            <ul className="space-y-3 text-sm text-stone-600">
              {provider.services.map((service) => (
                <li key={service} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
                  {service}
                </li>
              ))}
            </ul>
          </InfoBlock>
          <InfoBlock title="客户评价">
            <div className="space-y-4">
              {provider.reviews.map((review) => (
                <p key={review} className="rounded-xl bg-stone-50 p-4 text-sm leading-7 text-stone-600">
                  “{review}”
                </p>
              ))}
            </div>
          </InfoBlock>
        </aside>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-5">
      <div className="mb-3 text-[var(--color-brand)]">{icon}</div>
      <p className="text-xs text-stone-400">{label}</p>
      <p className="mt-1 font-bold text-stone-950">{value}</p>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
      <h2 className="mb-5 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
