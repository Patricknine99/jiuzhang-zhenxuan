import type { Metadata } from "next";
import Link from "next/link";
import { SubmissionSummary } from "@/components/shared/SubmissionSummary";

export const metadata: Metadata = {
  title: "入驻申请已提交",
  description: "九章甄选已收到你的服务商入驻申请。"
};

export default function JoinSuccessPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-24 text-center md:px-6">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
      <h1 className="text-3xl font-bold">入驻申请已提交</h1>
      <p className="mt-4 leading-8 text-stone-600">
        平台会在 3 个工作日内完成初筛。正式 API 接入后，申请会同步到飞书、企业微信或钉钉。
      </p>
      <SubmissionSummary expectedType="application" />
      <Link className="mt-8 inline-flex rounded-xl bg-[var(--color-brand)] px-6 py-3 font-semibold text-white" href="/cases">
        查看平台案例标准
      </Link>
    </section>
  );
}
