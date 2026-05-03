import type { Metadata } from "next";
import { BuyerDashboard } from "@/components/buyers/BuyerDashboard";

export const metadata: Metadata = {
  title: "需求方工作台",
  description: "查看已发布的需求、跟进状态和匹配到的服务商。"
};

export default function BuyerDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14 md:px-6 md:py-20">
      <BuyerDashboard />
    </div>
  );
}
