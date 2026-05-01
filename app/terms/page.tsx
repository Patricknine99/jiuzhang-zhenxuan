import type { Metadata } from "next";
import { ArticlePage } from "@/components/shared/ArticlePage";

export const metadata: Metadata = {
  title: "用户服务协议",
  description: "九章甄选用户服务协议占位页面，正式版本将由法律顾问补充。"
};

export default function TermsPage() {
  return (
    <ArticlePage title="用户服务协议" description="本页面为 v1.0 占位版本，正式协议需由法律顾问结合公司主体、服务范围和交易流程起草。">
      <h2>服务说明</h2>
      <p>九章甄选提供 AI 服务商展示、案例参考、需求诊断和撮合辅助服务。平台不替代企业自身的采购、法务和财务审查。</p>
      <h2>用户责任</h2>
      <p>用户提交的信息应真实、合法、完整，不得上传侵犯第三方权益或违反法律法规的内容。</p>
      <h2>交易与验收</h2>
      <p>具体交易条款、交付节点、付款安排和验收标准，以用户与服务商及平台确认的项目文件为准。</p>
    </ArticlePage>
  );
}
