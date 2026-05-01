import type { Metadata } from "next";
import { SystemStatusPanel } from "@/components/status/SystemStatusPanel";

export const metadata: Metadata = {
  title: "系统状态",
  description: "查看九章甄选主站、线索中转和数据库接口预留状态。"
};

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-6 md:py-20">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold text-[var(--color-brand)]">灰度检查</p>
        <h1 className="mt-2 text-3xl font-bold md:text-5xl">系统状态</h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">
          用于灰度期快速确认主站、线索中转和数据库占位状态。真实生产环境可接入监控告警。
        </p>
      </div>
      <SystemStatusPanel />
    </div>
  );
}
