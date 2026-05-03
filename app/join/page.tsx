import type { Metadata } from "next";
import Link from "next/link";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { FormSection } from "@/components/shared/FormSection";
import { StaticForm } from "@/components/shared/StaticForm";

export const metadata: Metadata = {
  title: "服务商入驻",
  description: "申请成为九章甄选精选 AI 服务商，提交团队信息、案例链接、技术栈、预算区间和开票能力。"
};

export default function JoinPage() {
  return (
    <FormSection
      title="申请成为精选服务商"
      description="平台会根据真实案例、交付能力、行业适配度进行初步筛选，3 个工作日内邮件通知审核结果。"
    >
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
        这是供给方通道。建议先了解{" "}
        <Link href="/creators" className="font-semibold text-[var(--color-brand)]">
          供给方认证路径
        </Link>
        ，并注册服务商账号，后续可查看审核状态和补充资料。{" "}
        <Link href="/register?role=provider" className="font-semibold text-[var(--color-brand)]">
          去注册服务商账号
        </Link>
      </div>
      <StaticForm successPath="/join/success" leadType="application">
        <FieldGroup label="团队/个人名称" required>
          <input className="field" name="teamName" required />
        </FieldGroup>
        <FieldGroup label="擅长方向" required>
          <div className="flex flex-wrap gap-2">
            {["企业知识库", "客服 Agent", "自动化流程", "商品图", "短视频", "数字人", "内容创作", "RAG 架构", "AI 硬件产品", "智能设备/IoT", "机器人", "AI 芯片/模组"].map((item) => (
              <label key={item} className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-600 has-[:checked]:border-orange-300 has-[:checked]:bg-amber-100 has-[:checked]:text-amber-900">
                <input className="sr-only" type="checkbox" name="direction" value={item} />
                {item}
              </label>
            ))}
          </div>
        </FieldGroup>
        <FieldGroup label="已有案例链接（至少 3 个）" required>
          <textarea className="field min-h-28" name="caseLinks" required placeholder="每行一个案例链接或产品说明，附简短介绍更好" />
        </FieldGroup>
        <FieldGroup label="技术栈" required>
          <textarea className="field min-h-24" name="techStack" required />
        </FieldGroup>
        <FieldGroup label="可接预算区间" required>
          <div className="flex flex-wrap gap-2">
            {["<5千", "5千-2万", "2-5万", "5万+"].map((value) => (
              <label key={value} className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-600 has-[:checked]:border-orange-300 has-[:checked]:bg-amber-100 has-[:checked]:text-amber-900">
                <input className="sr-only" type="radio" name="budgetRange" value={value} required />
                {value}
              </label>
            ))}
          </div>
        </FieldGroup>
        <FieldGroup label="是否可开票" required>
          <div className="flex gap-2">
            {["是", "否"].map((value) => (
              <label key={value} className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 has-[:checked]:border-orange-300 has-[:checked]:bg-amber-100 has-[:checked]:text-amber-900">
                <input className="sr-only" type="radio" name="canInvoice" value={value} required />
                {value}
              </label>
            ))}
          </div>
        </FieldGroup>
        <div className="grid gap-5 md:grid-cols-2">
          <FieldGroup label="手机号" required>
            <input className="field" name="contactPhone" type="tel" required />
          </FieldGroup>
          <FieldGroup label="微信号">
            <input className="field" name="contactWechat" />
          </FieldGroup>
        </div>
      </StaticForm>
    </FormSection>
  );
}
