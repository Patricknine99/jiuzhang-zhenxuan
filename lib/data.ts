import cases from "@/data/cases.json";
import providers from "@/data/providers.json";
import type { CaseStudy, Provider, ProviderLevel } from "@/lib/types";

const levelRank: Record<ProviderLevel, number> = {
  L1: 1,
  L2: 2,
  L3: 3
};

export function getProviders() {
  return [...(providers as Provider[])].sort((a, b) => {
    const levelDelta = levelRank[b.level] - levelRank[a.level];
    if (levelDelta !== 0) return levelDelta;
    return b.rating - a.rating || a.sortOrder - b.sortOrder;
  });
}

export function getFeaturedProviders() {
  return getProviders()
    .filter((provider) => provider.featured)
    .slice(0, 6);
}

export function getProvider(slug: string) {
  return getProviders().find((provider) => provider.slug === slug);
}

export function getCases() {
  return [...(cases as CaseStudy[])].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getFeaturedCases() {
  return getCases()
    .filter((caseStudy) => caseStudy.featured)
    .slice(0, 2);
}

export function getCase(slug: string) {
  return getCases().find((caseStudy) => caseStudy.slug === slug);
}

export function getCasesByProvider(providerSlug: string) {
  return getCases().filter((caseStudy) => caseStudy.providerSlug === providerSlug);
}

export function formatCurrencyRange(min: number, max: number) {
  return `¥${min.toLocaleString("zh-CN")} - ${max.toLocaleString("zh-CN")}`;
}
