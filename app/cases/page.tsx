import type { Metadata } from "next";
import { CasesExplorer } from "@/components/cases/CasesExplorer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getCases } from "@/lib/data";

export const metadata: Metadata = {
  title: "AI 商业案例库",
  description: "查看九章甄选整理的 AI 商业交付案例，了解行业痛点、方案拆解、实施预算和可量化效果。"
};

export default function CasesPage() {
  const cases = getCases();

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <SectionHeading title="AI 商业案例库" description="每个案例都按企业背景、痛点、方案、效果和预算拆解，帮助你判断 AI 项目是否值得做。" />
      <CasesExplorer cases={cases} />
    </div>
  );
}
