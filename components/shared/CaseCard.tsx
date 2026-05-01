import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CaseStudy } from "@/lib/types";

export function CaseCard({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <Link href={`/cases/${caseStudy.slug}`} className="editorial-card block h-full rounded-2xl bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
          {caseStudy.category}
        </span>
        {caseStudy.industry.map((item) => (
          <span key={item} className="rounded bg-stone-100 px-2.5 py-1 text-xs text-stone-500">
            {item}
          </span>
        ))}
      </div>
      <h3 className="text-xl font-bold leading-snug text-stone-950">{caseStudy.title}</h3>
      <p className="mt-4 text-sm leading-7 text-stone-500">{caseStudy.problem}</p>
      <div className="mt-6 flex flex-col gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-stone-400">可量化效果</p>
          <p className="mt-1 font-bold text-[var(--color-brand)]">{caseStudy.roiText}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)]">
          看详情 <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
