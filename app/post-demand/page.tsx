import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { FormSection } from "@/components/shared/FormSection";
import { LeadContextNotice } from "@/components/shared/LeadContextNotice";
import { StaticForm } from "@/components/shared/StaticForm";

export const metadata: Metadata = {
  title: "发布 AI 需求",
  description: "提交你的业务痛点、预算和期望交付时间，九章甄选将在 24 小时内协助拆解需求并推荐合适服务商。"
};

export default function PostDemandPage() {
  return (
    <FormSection
      title="发布企业 AI 需求"
      description="不用先写完整 PRD。把业务痛点、预算范围和期望交付告诉我们，平台产品经理会先帮你判断方向和匹配服务商。"
    >
      <div className="mb-5 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-600">
        这是需求方通道。还没想清楚预算或交付范围，可以先从{" "}
        <Link href="/buyers" className="font-semibold text-[var(--color-brand)]">
          需求方入口
        </Link>{" "}
        查看完整流程。
      </div>
      <StaticForm successPath="/post-demand/success" leadType="demand">
        <Suspense fallback={null}>
          <LeadContextNotice />
        </Suspense>
        <div className="grid gap-5 md:grid-cols-2">
          <FieldGroup label="公司名称" required>
            <input className="field" name="company" required />
          </FieldGroup>
          <FieldGroup label="联系人" required>
            <input className="field" name="contactName" required />
          </FieldGroup>
        </div>
        <FieldGroup label="所属行业" required>
          <select className="field" name="industry" required defaultValue="">
            <option value="" disabled>
              请选择行业
            </option>
            {["电商", "教育", "外贸", "本地生活", "文旅", "法律", "财税", "MCN", "游戏", "广告", "制造", "其他"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </FieldGroup>
        <FieldGroup label="业务痛点" required>
          <textarea
            className="field min-h-32"
            name="painPoint"
            required
            placeholder="描述你想用 AI 解决什么问题，越具体越好"
          />
        </FieldGroup>
        <FieldGroup label="预算区间" required>
          <RadioRow name="budgetRange" values={["<5千", "5千-2万", "2-5万", "5万+", "未确定"]} />
        </FieldGroup>
        <FieldGroup label="期望交付" required>
          <RadioRow name="expectedDelivery" values={["<1周", "1-4周", "1-3月", "不紧急"]} />
        </FieldGroup>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" name="needRecommend" defaultChecked className="h-4 w-4 accent-[var(--color-brand)]" />
          需要平台推荐服务商
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <FieldGroup label="手机号">
            <input className="field" name="phone" type="tel" />
          </FieldGroup>
          <FieldGroup label="微信号">
            <input className="field" name="wechat" />
          </FieldGroup>
        </div>
        <p className="form-hint">手机号和微信号至少填写一项，仅用于平台产品经理跟进需求诊断。</p>
      </StaticForm>
    </FormSection>
  );
}

function RadioRow({ name, values }: { name: string; values: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <label key={value} className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-600 has-[:checked]:border-orange-300 has-[:checked]:bg-amber-100 has-[:checked]:text-amber-900">
          <input className="sr-only" type="radio" name={name} value={value} required />
          {value}
        </label>
      ))}
    </div>
  );
}
