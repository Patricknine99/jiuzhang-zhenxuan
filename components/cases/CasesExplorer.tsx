"use client";

import { useMemo, useState } from "react";
import { CaseCard } from "@/components/shared/CaseCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { CaseStudy } from "@/lib/types";

export function CasesExplorer({ cases }: { cases: CaseStudy[] }) {
  const industries = useMemo(() => Array.from(new Set(cases.flatMap((caseStudy) => caseStudy.industry))).sort(), [cases]);
  const categories = useMemo(() => Array.from(new Set(cases.map((caseStudy) => caseStudy.category))).sort(), [cases]);
  const [industry, setIndustry] = useState("");
  const [category, setCategory] = useState("");
  const [effect, setEffect] = useState("");

  const filteredCases = cases.filter((caseStudy) => {
    const industryMatch = !industry || caseStudy.industry.includes(industry);
    const categoryMatch = !category || caseStudy.category === category;
    const effectMatch = !effect || caseStudy.roiText.includes(effect);
    return industryMatch && categoryMatch && effectMatch;
  });

  const reset = () => {
    setIndustry("");
    setCategory("");
    setEffect("");
  };

  return (
    <div className="mt-8 space-y-8">
      <div className="editorial-card rounded-2xl bg-white p-5">
        <div className="grid gap-5 md:grid-cols-3">
          <FilterSelect label="行业" value={industry} onChange={setIndustry} options={industries} placeholder="全部行业" />
          <FilterSelect label="服务类型" value={category} onChange={setCategory} options={categories} placeholder="全部类型" />
          <FilterSelect label="效果关键词" value={effect} onChange={setEffect} options={["↓", "↑", "成本", "效率", "周期"]} placeholder="全部效果" />
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm text-stone-500">
          <span>找到 {filteredCases.length} 个案例</span>
          <button type="button" className="font-semibold text-[var(--color-brand)]" onClick={reset}>
            清空筛选
          </button>
        </div>
      </div>

      {filteredCases.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredCases.map((caseStudy) => (
            <CaseCard key={caseStudy.slug} caseStudy={caseStudy} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="暂无匹配的案例"
          description="可以放宽行业或服务类型筛选。案例库仍在持续补充，早期建议直接发布需求获取人工诊断。"
          action={
            <button type="button" className="rounded-xl bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white" onClick={reset}>
              清空筛选
            </button>
          }
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-semibold text-stone-400">{label}</span>
      <select className="field py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
