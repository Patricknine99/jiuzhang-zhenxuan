import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CaseStudy } from "@/lib/types";

export function CaseCardDark({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <article className="relative overflow-hidden rounded-2xl bg-stone-800">
      <span className="absolute right-0 top-0 rounded-bl-xl border-b border-l border-stone-600 bg-stone-700 px-3 py-1.5 text-[10px] text-stone-300">
        {caseStudy.aiLabel}
      </span>
      <div className="p-7 md:p-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-300">
          Case Study · {caseStudy.category}
        </p>
        <h3 className="pr-8 text-xl font-bold leading-snug text-stone-100">{caseStudy.title}</h3>
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-[#3b2e2b] p-4">
            <p className="mb-1 text-xs font-bold text-rose-200">企业痛点</p>
            <p className="text-sm leading-7 text-stone-300">{caseStudy.problem}</p>
          </div>
          <div className="rounded-xl bg-[#18382f] p-4">
            <p className="mb-1 text-xs font-bold text-emerald-200">方案</p>
            <p className="text-sm leading-7 text-stone-300">{caseStudy.solution}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-4 border-t border-stone-600 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs text-stone-400">可量化效果</p>
            <p className="text-lg font-bold text-orange-300">{caseStudy.roiText}</p>
          </div>
          <div className="sm:text-right">
            <p className="mb-1 text-xs text-stone-400">实施预算</p>
            <p className="text-lg font-semibold text-stone-100">{caseStudy.budgetText}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-stone-800 bg-stone-900 px-7 py-4 text-sm md:px-8">
        <span className="text-stone-400">
          服务商：<span className="font-medium text-stone-200">{caseStudy.providerName}</span>
        </span>
        <Link href={`/cases/${caseStudy.slug}`} className="inline-flex items-center gap-1 font-semibold text-orange-300">
          索取方案报价 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
