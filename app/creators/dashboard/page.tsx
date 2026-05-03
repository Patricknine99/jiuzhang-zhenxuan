import type { Metadata } from "next";
import { ProviderDashboard } from "@/components/creators/ProviderDashboard";

export const metadata: Metadata = {
  title: "供给方工作台",
  description: "查看入驻状态、接单机会和认证进度。"
};

export default function ProviderDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14 md:px-6 md:py-20">
      <ProviderDashboard />
    </div>
  );
}
