import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { formatCurrencyRange } from "@/lib/data";
import type { Provider } from "@/lib/types";
import { LevelBadge } from "@/components/shared/LevelBadge";

export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="editorial-card flex h-full flex-col overflow-hidden rounded-2xl bg-white"
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h3 className="text-lg font-bold text-stone-950">{provider.name}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-500">{provider.description}</p>
          </div>
          <LevelBadge level={provider.level} label={provider.levelLabel} />
        </div>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {provider.tags.map((tag) => (
            <span key={tag} className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">
              {tag}
            </span>
          ))}
        </div>
        <dl className="mt-auto space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">擅长行业</dt>
            <dd className="text-right font-medium text-stone-700">{provider.industry.join(" / ")}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">交付周期</dt>
            <dd className="font-medium text-stone-700">
              {provider.deliveryMin} - {provider.deliveryMax} 天
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">预算区间</dt>
            <dd className="font-semibold text-[var(--color-brand)]">
              {formatCurrencyRange(provider.budgetMin, provider.budgetMax)}
            </dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="flex items-center text-stone-500">
          <Star className="mr-1 h-4 w-4 fill-[var(--color-brand)] text-[var(--color-brand)]" />
          <strong className="mr-1 text-stone-950">{provider.rating.toFixed(1)}</strong>
          · {provider.caseCount} 个案例
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-brand)]">
          详情 <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
