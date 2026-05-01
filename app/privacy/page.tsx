import type { Metadata } from "next";
import { ArticlePage } from "@/components/shared/ArticlePage";

export const metadata: Metadata = {
  title: "隐私政策",
  description: "九章甄选隐私政策占位页面，说明线索信息、联系方式和业务需求数据的使用边界。"
};

export default function PrivacyPage() {
  return (
    <ArticlePage title="隐私政策" description="本页面为 v1.0 占位版本，正式隐私政策需按实际数据处理流程和部署环境补充。">
      <h2>信息收集</h2>
      <p>平台可能收集公司名称、联系人、联系方式、业务痛点、预算区间、案例链接和服务商申请资料，用于需求诊断和服务商匹配。</p>
      <h2>信息使用</h2>
      <p>信息仅用于平台运营、服务商筛选、项目沟通、交付管理和必要的合规审计，不会出售给无关第三方。</p>
      <h2>第三方系统</h2>
      <p>线索可能同步至飞书、企业微信、钉钉等内部协作系统。正式上线前需明确各系统的数据权限、保存周期和删除机制。</p>
    </ArticlePage>
  );
}
