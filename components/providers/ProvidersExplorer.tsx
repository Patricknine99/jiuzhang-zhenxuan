"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProviderCard } from "@/components/shared/ProviderCard";
import type { Provider, ProviderLevel } from "@/lib/types";

const levelOptions: { label: string; value: ProviderLevel }[] = [
  { label: "L1", value: "L1" },
  { label: "L2", value: "L2" },
  { label: "L3", value: "L3" }
];

const budgetOptions = [
  { label: "<5千", min: 0, max: 5000 },
  { label: "5千-2万", min: 5000, max: 20000 },
  { label: "2-5万", min: 20000, max: 50000 },
  { label: "5万+", min: 50000, max: Number.POSITIVE_INFINITY }
];

const deliveryOptions = [
  { label: "1周内", max: 7 },
  { label: "1-4周", max: 28 },
  { label: "1-3月", max: 90 }
];

export function ProvidersExplorer({ providers }: { providers: Provider[] }) {
  const industries = useMemo(() => Array.from(new Set(providers.flatMap((provider) => provider.industry))).sort(), [providers]);
  const [levels, setLevels] = useState<ProviderLevel[]>([]);
  const [industry, setIndustry] = useState("");
  const [budget, setBudget] = useState("");
  const [delivery, setDelivery] = useState("");

  const filteredProviders = providers.filter((provider) => {
    const levelMatch = levels.length === 0 || levels.includes(provider.level);
    const industryMatch = !industry || provider.industry.includes(industry);
    const budgetRange = budgetOptions.find((option) => option.label === budget);
    const budgetMatch =
      !budgetRange || (provider.budgetMin <= budgetRange.max && provider.budgetMax >= budgetRange.min);
    const deliveryRange = deliveryOptions.find((option) => option.label === delivery);
    const deliveryMatch = !deliveryRange || provider.deliveryMin <= deliveryRange.max;
    return levelMatch && industryMatch && budgetMatch && deliveryMatch;
  });

  const reset = () => {
    setLevels([]);
    setIndustry("");
    setBudget("");
    setDelivery("");
  };

  return (
    <div className="mt-8 space-y-8">
      <div className="editorial-card rounded-2xl bg-white p-5">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <FilterGroup label="认证等级">
            <div className="flex flex-wrap gap-2">
              {levelOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setLevels((current) =>
                      current.includes(option.value)
                        ? current.filter((item) => item !== option.value)
                        : [...current, option.value]
                    )
                  }
                  className={chipClass(levels.includes(option.value))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup label="行业">
            <select className="field py-2 text-sm" value={industry} onChange={(event) => setIndustry(event.target.value)}>
              <option value="">全部行业</option>
              {industries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup label="预算">
            <select className="field py-2 text-sm" value={budget} onChange={(event) => setBudget(event.target.value)}>
              <option value="">全部预算</option>
              {budgetOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup label="交付周期">
            <select className="field py-2 text-sm" value={delivery} onChange={(event) => setDelivery(event.target.value)}>
              <option value="">全部周期</option>
              {deliveryOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterGroup>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm text-stone-500">
          <span>找到 {filteredProviders.length} 家服务商</span>
          <button type="button" className="font-semibold text-[var(--color-brand)]" onClick={reset}>
            清空筛选
          </button>
        </div>
      </div>

      {filteredProviders.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map((provider) => (
            <ProviderCard key={provider.slug} provider={provider} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="暂无匹配的服务商"
          description="试试放宽认证等级、行业、预算或交付周期。也可以先发布需求，由平台产品经理帮你判断匹配范围。"
          action={
            <button type="button" className="rounded-xl bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white" onClick={reset}>
              清空筛选
            </button>
          }
        />
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-stone-400">{label}</p>
      {children}
    </div>
  );
}

function chipClass(active: boolean) {
  return [
    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
    active ? "border-orange-300 bg-amber-100 text-amber-900" : "border-stone-200 bg-stone-100 text-stone-600 hover:border-stone-300"
  ].join(" ");
}
