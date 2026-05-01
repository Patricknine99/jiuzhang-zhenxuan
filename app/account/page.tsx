import type { Metadata } from "next";
import { AccountPanel } from "@/components/auth/AccountPanel";

export const metadata: Metadata = {
  title: "我的账号",
  description: "查看九章甄选本地账号状态。"
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:px-6 md:py-20">
      <AccountPanel />
    </div>
  );
}
