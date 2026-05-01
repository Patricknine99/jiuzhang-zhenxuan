"use client";

import { useSearchParams } from "next/navigation";
import { getCase, getProvider } from "@/lib/data";
import { getIndustryCategory, getServiceCategory } from "@/lib/catalog";

export function LeadContextNotice() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");
  const caseSlug = searchParams.get("case");
  const service = searchParams.get("service");
  const industry = searchParams.get("industry");

  const context = getContextText({ provider, caseSlug, service, industry });
  if (!context) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
      已带入咨询上下文：{context}
      <input type="hidden" name="context" value={context} />
    </div>
  );
}

function getContextText({
  provider,
  caseSlug,
  service,
  industry
}: {
  provider: string | null;
  caseSlug: string | null;
  service: string | null;
  industry: string | null;
}) {
  if (provider) {
    const item = getProvider(provider);
    return item ? `服务商「${item.name}」` : `服务商 ${provider}`;
  }
  if (caseSlug) {
    const item = getCase(caseSlug);
    return item ? `案例「${item.title}」` : `案例 ${caseSlug}`;
  }
  if (service) {
    const item = getServiceCategory(service);
    return item ? `服务类型「${item.title}」` : `服务类型 ${service}`;
  }
  if (industry) {
    const item = getIndustryCategory(industry);
    return item ? `行业「${item.title}」` : `行业 ${industry}`;
  }
  return "";
}
