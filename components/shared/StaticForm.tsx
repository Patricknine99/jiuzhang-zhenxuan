"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { ApplicationLead, DemandLead, LeadPayload } from "@/lib/integrations";

type RelayResponse = {
  ok?: boolean;
  message?: string;
  requestId?: string;
  error?: {
    code?: string;
    message?: string;
  };
  results?: Array<{
    ok: boolean;
    channel: string;
    message: string;
  }>;
};

export function StaticForm({
  successPath,
  leadType,
  children
}: {
  successPath: string;
  leadType: LeadPayload["type"];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setRequestId("");
        setIsSubmitting(true);
        try {
          const payload = buildLeadPayload(new FormData(event.currentTarget), leadType);
          const relayUrl = process.env.NEXT_PUBLIC_LEAD_RELAY_URL;
          if (relayUrl) {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), getSubmitTimeoutMs());
            const response = await fetch(relayUrl, {
              method: "POST",
              headers: buildRelayHeaders(),
              body: JSON.stringify(payload),
              signal: controller.signal
            }).finally(() => window.clearTimeout(timeout));
            const body = (await response.json().catch(() => null)) as RelayResponse | null;
            const nextRequestId = body?.requestId || response.headers.get("X-Request-Id") || "";
            if (nextRequestId) setRequestId(nextRequestId);
            if (!response.ok || body?.ok === false) {
              const message = body?.error?.message || body?.message || "提交失败，请稍后重试";
              throw new Error(nextRequestId ? `${message}（请求编号：${nextRequestId}）` : message);
            }
            rememberSubmission(leadType, body || { ok: true }, nextRequestId);
          } else {
            rememberSubmission(leadType, { ok: true, message: "静态演示模式提交成功" }, "static-demo");
          }
          router.push(successPath);
        } catch (caught) {
          const message =
            caught instanceof DOMException && caught.name === "AbortError"
              ? "提交超时，请检查网络后重试"
              : caught instanceof Error
                ? caught.message
                : "提交失败，请稍后重试";
          setError(message);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {children}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}
      {requestId && !error ? <p className="submit-meta">请求编号：{requestId}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner />
            提交中，请稍候
          </>
        ) : (
          "提交"
        )}
      </button>
    </form>
  );
}

function buildLeadPayload(formData: FormData, leadType: LeadPayload["type"]): LeadPayload {
  if (leadType === "demand") {
    const payload = {
      type: "demand",
      company: getString(formData, "company"),
      contactName: getString(formData, "contactName"),
      industry: getString(formData, "industry"),
      painPoint: getString(formData, "painPoint"),
      budgetRange: getString(formData, "budgetRange"),
      expectedDelivery: getString(formData, "expectedDelivery"),
      needRecommend: formData.get("needRecommend") === "on",
      phone: getOptionalString(formData, "phone"),
      wechat: getOptionalString(formData, "wechat"),
      context: getOptionalString(formData, "context"),
      source: typeof window === "undefined" ? undefined : window.location.href
    } satisfies DemandLead;
    if (!payload.phone && !payload.wechat) {
      throw new Error("请至少填写手机号或微信号，方便平台产品经理跟进");
    }
    return payload;
  }

  const payload = {
    type: "application",
    teamName: getString(formData, "teamName"),
    direction: formData.getAll("direction").map(String).filter(Boolean),
    caseLinks: getString(formData, "caseLinks"),
    techStack: getString(formData, "techStack"),
    budgetRange: getString(formData, "budgetRange"),
    canInvoice: getString(formData, "canInvoice") === "是",
    contactPhone: getString(formData, "contactPhone"),
    contactWechat: getOptionalString(formData, "contactWechat")
  } satisfies ApplicationLead;
  if (payload.direction.length === 0) {
    throw new Error("请至少选择一个擅长方向");
  }
  return payload;
}

function buildRelayHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  const secret = process.env.NEXT_PUBLIC_LEAD_RELAY_SECRET;
  if (secret) headers["X-Lead-Relay-Secret"] = secret;
  return headers;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  return value || undefined;
}

function getSubmitTimeoutMs() {
  const value = Number(process.env.NEXT_PUBLIC_LEAD_SUBMIT_TIMEOUT_MS || 12000);
  return Number.isFinite(value) && value > 0 ? value : 12000;
}

function rememberSubmission(type: LeadPayload["type"], body: RelayResponse, requestId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    "jiuzhang:lastLeadSubmission",
    JSON.stringify({
      type,
      requestId,
      ok: body.ok ?? true,
      results: body.results || [],
      submittedAt: new Date().toISOString()
    })
  );
}
