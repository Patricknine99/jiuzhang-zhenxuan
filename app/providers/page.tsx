import type { Metadata } from "next";
import { ProvidersExplorer } from "@/components/providers/ProvidersExplorer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getProviders } from "@/lib/data";

export const metadata: Metadata = {
  title: "AI 服务商精选库",
  description: "浏览九章甄选认证的 AI 服务商，按认证等级、行业、预算区间和交付周期筛选合适的创作者与工作室。"
};

export default function ProvidersPage() {
  const providers = getProviders();

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <SectionHeading title="AI 服务商精选库" description="按认证等级、行业、预算和交付周期，找到适合你业务阶段的 AI 服务商。" />
      <ProvidersExplorer providers={providers} />
    </div>
  );
}
