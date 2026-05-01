"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

type HealthState =
  | { status: "checking" }
  | { status: "ok"; requestId?: string; channels?: string[]; dryRun?: boolean }
  | { status: "not-configured" }
  | { status: "error"; message: string };

export function SystemStatusPanel() {
  const relayUrl = process.env.NEXT_PUBLIC_LEAD_RELAY_URL;
  const [health, setHealth] = useState<HealthState>(relayUrl ? { status: "checking" } : { status: "not-configured" });

  useEffect(() => {
    if (!relayUrl) return;
    const healthUrl = relayUrl.replace(/\/api\/leads\/?$/, "/healthz");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    fetch(healthUrl, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.message || "Relay health check failed");
        setHealth({
          status: "ok",
          requestId: data.requestId,
          channels: data.channels,
          dryRun: data.dryRun
        });
      })
      .catch((error) => {
        setHealth({
          status: "error",
          message:
            error instanceof DOMException && error.name === "AbortError"
              ? "健康检查超时，请检查 relay 网络或部署状态。"
              : error instanceof Error
                ? error.message
                : "健康检查失败"
        });
      })
      .finally(() => window.clearTimeout(timeout));
  }, [relayUrl]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatusCard title="主站" status="ok" description="静态页面构建与路由 smoke test 已覆盖。" />
      <StatusCard
        title="线索中转"
        status={health.status}
        description={getRelayDescription(health)}
      />
      <StatusCard title="数据库" status="not-configured" description="接口已预留，当前按产品要求不连接真实数据库。" />
    </div>
  );
}

function StatusCard({
  title,
  status,
  description
}: {
  title: string;
  status: HealthState["status"] | "ok";
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-bold">{title}</h2>
        <span className={badgeClass(status)}>
          {status === "checking" ? <LoadingSpinner /> : null}
          {statusLabel(status)}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-stone-600">{description}</p>
    </div>
  );
}

function getRelayDescription(health: HealthState) {
  if (health.status === "checking") return "正在检查 relay 健康状态。";
  if (health.status === "not-configured") return "未配置 NEXT_PUBLIC_LEAD_RELAY_URL，表单将以静态演示模式提交。";
  if (health.status === "error") return health.message;
  return `健康检查通过，渠道：${health.channels?.join("、") || "未配置"}${health.dryRun ? "（dry-run）" : ""}。`;
}

function statusLabel(status: HealthState["status"] | "ok") {
  if (status === "ok") return "正常";
  if (status === "checking") return "检查中";
  if (status === "not-configured") return "预留";
  return "异常";
}

function badgeClass(status: HealthState["status"] | "ok") {
  const base = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold";
  if (status === "ok") return `${base} bg-emerald-100 text-emerald-700`;
  if (status === "checking") return `${base} bg-amber-100 text-amber-800`;
  if (status === "not-configured") return `${base} bg-stone-100 text-stone-600`;
  return `${base} bg-red-100 text-red-700`;
}
