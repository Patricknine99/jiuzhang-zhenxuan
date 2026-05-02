import cases from "@/data/cases.json";
import providers from "@/data/providers.json";
import type { CaseStudy, Provider, ProviderLevel } from "@/lib/types";

const providerLevels = ["L1", "L2", "L3"] as const;

const levelRank: Record<ProviderLevel, number> = {
  L1: 1,
  L2: 2,
  L3: 3
};

const providerData = validateProviders(providers);
const caseData = validateCases(cases, new Set(providerData.map((provider) => provider.slug)));

export function getProviders() {
  return [...providerData].sort((a, b) => {
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
  return [...caseData].sort((a, b) => a.sortOrder - b.sortOrder);
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

function validateProviders(value: unknown): Provider[] {
  assertArray(value, "providers");
  const slugs = new Set<string>();
  return value.map((item, index) => {
    assertRecord(item, `providers[${index}]`);
    const provider = {
      slug: readString(item, "slug", `providers[${index}]`),
      name: readString(item, "name", `providers[${index}]`),
      level: readLevel(item, `providers[${index}]`),
      levelLabel: readString(item, "levelLabel", `providers[${index}]`),
      tags: readStringArray(item, "tags", `providers[${index}]`),
      industry: readStringArray(item, "industry", `providers[${index}]`),
      deliveryMin: readNumber(item, "deliveryMin", `providers[${index}]`),
      deliveryMax: readNumber(item, "deliveryMax", `providers[${index}]`),
      budgetMin: readNumber(item, "budgetMin", `providers[${index}]`),
      budgetMax: readNumber(item, "budgetMax", `providers[${index}]`),
      rating: readNumber(item, "rating", `providers[${index}]`),
      caseCount: readNumber(item, "caseCount", `providers[${index}]`),
      avatarUrl: readString(item, "avatarUrl", `providers[${index}]`, true),
      description: readString(item, "description", `providers[${index}]`),
      techStack: readStringArray(item, "techStack", `providers[${index}]`),
      canInvoice: readBoolean(item, "canInvoice", `providers[${index}]`),
      featured: readBoolean(item, "featured", `providers[${index}]`),
      sortOrder: readNumber(item, "sortOrder", `providers[${index}]`),
      responseTime: readString(item, "responseTime", `providers[${index}]`),
      services: readStringArray(item, "services", `providers[${index}]`),
      reviews: readStringArray(item, "reviews", `providers[${index}]`)
    } satisfies Provider;

    if (slugs.has(provider.slug)) throw new Error(`Duplicate provider slug: ${provider.slug}`);
    slugs.add(provider.slug);
    if (provider.rating < 0 || provider.rating > 5) throw new Error(`Provider ${provider.slug} rating must be between 0 and 5`);
    if (provider.deliveryMin > provider.deliveryMax) throw new Error(`Provider ${provider.slug} deliveryMin cannot exceed deliveryMax`);
    if (provider.budgetMin > provider.budgetMax) throw new Error(`Provider ${provider.slug} budgetMin cannot exceed budgetMax`);
    return provider;
  });
}

function validateCases(value: unknown, providerSlugs: Set<string>): CaseStudy[] {
  assertArray(value, "cases");
  const slugs = new Set<string>();
  return value.map((item, index) => {
    assertRecord(item, `cases[${index}]`);
    const caseStudy = {
      slug: readString(item, "slug", `cases[${index}]`),
      title: readString(item, "title", `cases[${index}]`),
      providerSlug: readString(item, "providerSlug", `cases[${index}]`),
      providerName: readString(item, "providerName", `cases[${index}]`),
      category: readString(item, "category", `cases[${index}]`),
      industry: readStringArray(item, "industry", `cases[${index}]`),
      background: readString(item, "background", `cases[${index}]`),
      problem: readString(item, "problem", `cases[${index}]`),
      solution: readString(item, "solution", `cases[${index}]`),
      process: readString(item, "process", `cases[${index}]`),
      roiText: readString(item, "roiText", `cases[${index}]`),
      budgetText: readString(item, "budgetText", `cases[${index}]`),
      aiLabel: readString(item, "aiLabel", `cases[${index}]`),
      featured: readBoolean(item, "featured", `cases[${index}]`),
      sortOrder: readNumber(item, "sortOrder", `cases[${index}]`)
    } satisfies CaseStudy;

    if (slugs.has(caseStudy.slug)) throw new Error(`Duplicate case slug: ${caseStudy.slug}`);
    slugs.add(caseStudy.slug);
    if (!providerSlugs.has(caseStudy.providerSlug)) {
      throw new Error(`Case ${caseStudy.slug} references missing provider ${caseStudy.providerSlug}`);
    }
    return caseStudy;
  });
}

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new Error(`Invalid data: ${label} must be an array`);
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid data: ${label} must be an object`);
  }
}

function readString(record: Record<string, unknown>, key: string, label: string, allowEmpty = false) {
  const value = record[key];
  if (typeof value !== "string" || (!allowEmpty && value.trim() === "")) {
    throw new Error(`Invalid data: ${label}.${key} must be a ${allowEmpty ? "string" : "non-empty string"}`);
  }
  return value;
}

function readNumber(record: Record<string, unknown>, key: string, label: string) {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid data: ${label}.${key} must be a finite number`);
  }
  return value;
}

function readBoolean(record: Record<string, unknown>, key: string, label: string) {
  const value = record[key];
  if (typeof value !== "boolean") throw new Error(`Invalid data: ${label}.${key} must be a boolean`);
  return value;
}

function readStringArray(record: Record<string, unknown>, key: string, label: string) {
  const value = record[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`Invalid data: ${label}.${key} must be an array of non-empty strings`);
  }
  return value;
}

function readLevel(record: Record<string, unknown>, label: string): ProviderLevel {
  const value = record.level;
  if (!providerLevels.includes(value as ProviderLevel)) {
    throw new Error(`Invalid data: ${label}.level must be L1, L2, or L3`);
  }
  return value as ProviderLevel;
}
