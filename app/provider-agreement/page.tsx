import type { Metadata } from "next";
import { ArticlePage } from "@/components/shared/ArticlePage";

export const metadata: Metadata = {
  title: "服务商入驻协议",
  description: "九章甄选服务商入驻协议占位页面，覆盖案例真实性、版权责任、交付标准和保密义务。"
};

export default function ProviderAgreementPage() {
  return (
    <ArticlePage title="服务商入驻协议" description="本页面为 v1.0 占位版本，正式协议需结合认证等级、交易模式和平台责任边界起草。">
      <h2>入驻资料</h2>
      <p>服务商应保证提交的身份、案例、报价、技术栈和开票能力真实有效，不得冒用他人作品或夸大交付能力。</p>
      <h2>版权与合规</h2>
      <p>服务商需声明模型、素材、数据集和交付物来源合法，并对版权瑕疵承担相应责任。含 AI 生成内容的案例应按规定进行标识。</p>
      <h2>交付与保密</h2>
      <p>服务商应遵守项目验收标准、响应 SLA 和客户保密要求，未经授权不得公开客户资料、业务数据或未脱敏案例。</p>
    </ArticlePage>
  );
}
