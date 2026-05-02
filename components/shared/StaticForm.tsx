"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HumanVerificationField } from "@/components/shared/HumanVerificationField";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { ApplicationLead, DemandLead, LeadPayload } from "@/lib/integrations";

type RelayResponse = {
  ok?: boolean;
  partialFailure?: boolean;
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
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const lastSubmitRef = useRef(0);
  const honeypotName = "jiuzhang_website_url";
  const draftKey = `jiuzhang:${leadType}:draft`;
  const draftTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debouncedSaveDraft = useCallback(
    (form: HTMLFormElement) => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => saveDraft(form, draftKey), 600);
    },
    [draftKey]
  );

  useEffect(() => {
    restoreDraft(formRef.current, draftKey);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [draftKey]);

  return (
    <form
      ref={formRef}
      className="space-y-5"
      onChange={(event) => {
        debouncedSaveDraft(event.currentTarget);
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setRequestId("");

        // Submission cooldown — prevent double-clicks and rapid re-submissions.
        const now = Date.now();
        if (now - lastSubmitRef.current < 5000) {
          setError("请稍等片刻后再提交");
          return;
        }
        lastSubmitRef.current = now;

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
          window.localStorage.removeItem(draftKey);
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
      {/* Honeypot: hidden field that bots fill but humans never see. If filled, relay will reject. */}
      <div className="absolute opacity-0 pointer-events-none" aria-hidden="true" tabIndex={-1}>
        <label htmlFor={honeypotName}>Website</label>
        <input id={honeypotName} name={honeypotName} type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <HumanVerificationField />
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
      source: typeof window === "undefined" ? undefined : window.location.href,
      captchaToken: getOptionalString(formData, "captchaToken")
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
    contactWechat: getOptionalString(formData, "contactWechat"),
    captchaToken: getOptionalString(formData, "captchaToken")
  } satisfies ApplicationLead;
  if (payload.direction.length === 0) {
    throw new Error("请至少选择一个擅长方向");
  }
  return payload;
}

function buildRelayHeaders() {
  return {
    "Content-Type": "application/json"
  };
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
  const submission = {
    type,
    requestId,
    ok: body.ok ?? true,
    partialFailure: body.partialFailure ?? false,
    results: body.results || [],
    submittedAt: new Date().toISOString()
  };
  window.sessionStorage.setItem(
    "jiuzhang:lastLeadSubmission",
    JSON.stringify(submission)
  );
  const raw = window.localStorage.getItem("jiuzhang:submissions");
  const current = raw ? (JSON.parse(raw) as typeof submission[]) : [];
  window.localStorage.setItem("jiuzhang:submissions", JSON.stringify([submission, ...current].slice(0, 10)));
}

function saveDraft(form: HTMLFormElement, draftKey: string) {
  const data = new FormData(form);
  const values: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const [key, value] of data.entries()) {
    if (key in values) {
      const existing = values[key];
      values[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      values[key] = value;
    }
  }
  window.localStorage.setItem(draftKey, JSON.stringify(values));
}

function restoreDraft(form: HTMLFormElement | null, draftKey: string) {
  if (!form) return;
  const raw = window.localStorage.getItem(draftKey);
  if (!raw) return;
  try {
    const values = JSON.parse(raw) as Record<string, string | string[]>;
    for (const element of Array.from(form.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
      const value = values[element.name];
      if (value === undefined) continue;
      if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
        element.checked = Array.isArray(value) ? value.includes(element.value) : value === element.value || value === "on";
      } else {
        element.value = Array.isArray(value) ? String(value[0] || "") : String(value);
      }
    }
  } catch {
    window.localStorage.removeItem(draftKey);
  }
}
