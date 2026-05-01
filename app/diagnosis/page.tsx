import type { Metadata } from "next";
import { DiagnosisWorkspace } from "@/components/diagnosis/DiagnosisWorkspace";

export const metadata: Metadata = {
  title: "AI 需求诊断",
  description: "通过 AI 需求诊断助手梳理业务问题、预算、周期和匹配方向，并预留接入自有 AI 服务的接口。"
};

export default function DiagnosisPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold text-[var(--color-brand)]">免费诊断</p>
        <h1 className="mt-2 text-3xl font-bold md:text-5xl">先让 AI 帮你把需求说清楚</h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">
          这里不会直接替代人工顾问，而是先把业务问题、成本、周期和目标整理成可沟通的摘要。后续可接入你自己的 AI 接口生成完整 PRD。
        </p>
      </div>
      <DiagnosisWorkspace />
    </div>
  );
}
