import type { Metadata } from "next";
import Link from "next/link";
import { SubmissionSummary } from "@/components/shared/SubmissionSummary";

export const metadata: Metadata = {
  title: "需求已提交",
  description: "九章甄选已收到你的 AI 需求，平台产品经理将在 24 小时内联系。"
};

export default function DemandSuccessPage() {
  return (
    <Success
      title="需求已提交"
      text="平台产品经理将在 24 小时内联系您。正式 API 接入后，这条线索会同步到飞书、企业微信或钉钉。"
    />
  );
}

function Success({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-24 text-center md:px-6">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-4 leading-8 text-stone-600">{text}</p>
      <SubmissionSummary expectedType="demand" />
      <Link className="mt-8 inline-flex rounded-xl bg-[var(--color-brand)] px-6 py-3 font-semibold text-white" href="/">
        返回首页
      </Link>
    </section>
  );
}
