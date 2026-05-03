"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, BriefcaseBusiness, FileCheck2, ShieldCheck } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { authStorageKey, authTokenStorageKey, type LocalAccount } from "@/lib/auth";

type Submission = {
  type: string;
  requestId: string;
  ok: boolean;
  partialFailure?: boolean;
  status?: string;
  payload?: {
    teamName?: string;
    direction?: string[];
    budgetRange?: string;
    contactPhone?: string;
  };
  submittedAt: string;
  results: Array<{ ok: boolean; channel: string; message: string }>;
};

type MineLeadsResponse = {
  ok?: boolean;
  requestId?: string;
  leads?: Submission[];
  error?: { message?: string };
  message?: string;
};

export function ProviderDashboard() {
  const accountRaw = useSyncExternalStore(subscribe, getAccountSnapshot, getServerSnapshot);
  const submissionsRaw = useSyncExternalStore(subscribe, getSubmissionsSnapshot, getServerSnapshot);
  const tokenRaw = useSyncExternalStore(subscribe, getTokenSnapshot, getServerSnapshot);
  const account = parseAccount(accountRaw);
  const localSubmissions = useMemo(() => parseSubmissions(submissionsRaw).filter((s) => s.type === "application"), [submissionsRaw]);
  const [remoteSubmissions, setRemoteSubmissions] = useState<Submission[] | null>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const accountRole = account?.role;
  const mineLeadsUrl = getMineLeadsUrl();
  const canSyncRemote = accountRole === "provider" && Boolean(tokenRaw) && Boolean(mineLeadsUrl);

  useEffect(() => {
    if (!canSyncRemote) return;
    const controller = new AbortController();
    async function loadMineLeads() {
      setIsLoadingRemote(true);
      setRemoteError("");
      try {
        const response = await fetch(mineLeadsUrl, {
          headers: { Authorization: `Bearer ${tokenRaw}` },
          signal: controller.signal
        });
        const body = (await response.json().catch(() => null)) as MineLeadsResponse | null;
        if (!response.ok || body?.ok === false) {
          throw new Error(body?.error?.message || body?.message || "入驻记录读取失败");
        }
        setRemoteSubmissions(Array.isArray(body?.leads) ? body.leads : []);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setRemoteSubmissions(null);
        setRemoteError(caught instanceof Error ? caught.message : "入驻记录读取失败");
      } finally {
        if (!controller.signal.aborted) setIsLoadingRemote(false);
      }
    }
    void loadMineLeads();
    return () => controller.abort();
  }, [canSyncRemote, mineLeadsUrl, tokenRaw]);

  const submissions = canSyncRemote && remoteSubmissions ? remoteSubmissions : localSubmissions;

  if (!account || account.role !== "provider") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200">
        <ShieldCheck className="mx-auto h-10 w-10 text-[var(--color-brand)]" />
        <h1 className="mt-4 text-2xl font-bold">请先登录供给方账号</h1>
        <p className="mt-3 text-stone-600">供给方工作台需要登录后才能查看入驻状态和匹配到的新需求。</p>
        <div className="mt-6 grid gap-3 sm:flex sm:justify-center">
          <Link href="/login?role=provider" className="rounded-xl bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white">
            登录供给方账号
          </Link>
          <Link href="/register?role=provider" className="rounded-xl border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700">
            创建供给方账号
          </Link>
        </div>
      </div>
    );
  }

  const pendingCount = submissions.filter(
    (s) => s.status === "pending" || (!s.ok && !s.partialFailure)
  ).length;
  const approvedCount = submissions.filter((s) => s.ok).length;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-[var(--color-brand)]">供给方工作台</p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">{account.displayName} 的入驻</h1>
          <p className="mt-4 text-stone-600">当前账号：{account.identifier}（{account.method === "phone" ? "手机号" : "邮箱"}登录）</p>
        </div>
        <Link
          href="/join"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]"
        >
          <FileCheck2 className="h-4 w-4" />
          提交入驻申请
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="全部申请" value={String(submissions.length)} />
        <MetricCard label="已处理" value={String(approvedCount)} />
        <MetricCard label="审核中" value={String(pendingCount)} />
      </section>

      <section className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">我的入驻申请</h2>
          {isLoadingRemote ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500">
              <LoadingSpinner />
              正在同步服务端记录
            </span>
          ) : remoteSubmissions ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">已同步服务端</span>
          ) : (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">本地记录</span>
          )}
        </div>
        {remoteError ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            服务端记录暂时不可用，当前展示本地提交记录。原因：{remoteError}
          </div>
        ) : null}
        {submissions.length === 0 ? (
          <div className="mt-5 rounded-xl bg-stone-50 p-6 text-center">
            <BriefcaseBusiness className="mx-auto h-6 w-6 text-stone-400" />
            <p className="mt-3 text-sm text-stone-500">还没有提交过入驻申请。</p>
            <Link href="/join" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand)]">
              提交入驻申请 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {submissions.map((submission) => (
              <div key={`${submission.requestId}-${submission.submittedAt}`} className="rounded-xl border border-stone-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold text-stone-900">{submission.payload?.teamName || "服务商入驻"}</span>
                  <StatusBadge ok={submission.ok} partialFailure={submission.partialFailure} />
                </div>
                {submission.payload?.direction ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {submission.payload.direction.slice(0, 5).map((d) => (
                      <span key={d} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{d}</span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                  {submission.payload?.budgetRange ? <span>预算区间：{submission.payload.budgetRange}</span> : null}
                </div>
                <p className="mt-2 break-all text-xs text-stone-500">请求编号：{submission.requestId || "local-demo"}</p>
                <p className="mt-1 text-xs text-stone-500">提交时间：{new Date(submission.submittedAt).toLocaleString("zh-CN")}</p>
                {submission.results && submission.results.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {submission.results
                      .filter((r) => r.channel !== "database")
                      .map((result) => (
                        <div key={result.channel} className="flex items-center gap-2 text-xs text-stone-500">
                          <span className={result.ok ? "text-emerald-600" : "text-red-600"}>{result.ok ? "✓" : "✗"}</span>
                          <span className="font-medium">{result.channel}</span>
                          <span>{result.message}</span>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-bold text-amber-900">下一步</h2>
        <p className="mt-2 text-sm leading-6 text-amber-800">
          平台会根据真实案例、交付能力、行业适配度在 3 个工作日内完成初筛，并通过邮件通知审核结果。认证通过后，您的服务商页面将对需求方可见。
        </p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <p className="text-xs font-semibold text-stone-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ ok, partialFailure }: { ok: boolean; partialFailure?: boolean }) {
  if (partialFailure) {
    return <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">部分异常</span>;
  }
  if (ok) {
    return <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700">已分发</span>;
  }
  return <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-700">失败</span>;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getAccountSnapshot() {
  return window.localStorage.getItem(authStorageKey) || "";
}

function getSubmissionsSnapshot() {
  return window.localStorage.getItem("jiuzhang:submissions") || "";
}

function getTokenSnapshot() {
  return window.localStorage.getItem(authTokenStorageKey) || "";
}

function getServerSnapshot() {
  return "";
}

function parseAccount(raw: string): LocalAccount | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalAccount;
  } catch {
    return null;
  }
}

function parseSubmissions(raw: string): Submission[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Submission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getMineLeadsUrl() {
  const leadUrl = process.env.NEXT_PUBLIC_LEAD_RELAY_URL;
  if (leadUrl) {
    const base = leadUrl.replace(/\/$/, "");
    return `${base.replace(/\/api\/leads$/, "/api/leads/mine")}?type=application`;
  }
  const authUrl = process.env.NEXT_PUBLIC_AUTH_RELAY_URL;
  if (authUrl) {
    const base = authUrl.replace(/\/$/, "");
    return `${base.replace(/\/api\/auth$/, "/api/leads/mine")}?type=application`;
  }
  return "";
}
