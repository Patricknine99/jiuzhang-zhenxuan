import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata: Metadata = {
  title: "后台管理员",
  description: "九章甄选后台管理员入口，用于客服、运营、财务和管理员处理线索、审核和系统状态。"
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <AdminConsole />
    </div>
  );
}
