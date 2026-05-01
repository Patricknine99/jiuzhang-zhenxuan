"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { authStorageKey, type LocalAccount } from "@/lib/auth";

type Submission = {
  type: "demand" | "application";
  requestId: string;
  ok: boolean;
  submittedAt: string;
  results: Array<{ ok: boolean; channel: string; message: string }>;
};

export function AccountPanel() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const submissionsRaw = useSyncExternalStore(subscribe, getSubmissionsSnapshot, getServerSnapshot);
  const account = parseAccount(raw);
  const submissions = parseSubmissions(submissionsRaw);

  if (!account) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200">
        <h1 className="text-2xl font-bold">还没有登录</h1>
        <p className="mt-3 text-stone-600">登录或注册后，后续可以查看需求诊断、服务商入驻状态和人工跟进记录。</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold">
            登录
          </Link>
          <Link href="/register" className="rounded-xl bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white">
            注册
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 ring-1 ring-stone-200">
      <p className="text-sm font-semibold text-[var(--color-brand)]">当前账号</p>
      <h1 className="mt-2 text-3xl font-bold">{account.displayName}</h1>
      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
        <Info label="登录方式" value={account.method === "phone" ? "手机号" : "邮箱"} />
        <Info label="账号标识" value={account.identifier} />
        <Info label="账号类型" value={account.role === "provider" ? "服务商" : "企业用户"} />
        <Info label="创建时间" value={new Date(account.createdAt).toLocaleString("zh-CN")} />
      </dl>
      <button
        type="button"
        className="mt-8 rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
        onClick={() => {
          window.localStorage.removeItem(authStorageKey);
          window.dispatchEvent(new StorageEvent("storage", { key: authStorageKey }));
        }}
      >
        退出登录
      </button>
      <section className="mt-10 border-t border-stone-100 pt-8">
        <h2 className="text-xl font-bold">最近提交</h2>
        {submissions.length > 0 ? (
          <div className="mt-4 space-y-3">
            {submissions.map((submission) => (
              <div key={`${submission.type}-${submission.requestId}-${submission.submittedAt}`} className="rounded-xl bg-stone-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-stone-900">{submission.type === "demand" ? "企业需求" : "服务商入驻"}</span>
                  <span className={submission.ok ? "text-emerald-700" : "text-red-700"}>{submission.ok ? "已提交" : "异常"}</span>
                </div>
                <p className="mt-2 break-all text-stone-500">请求编号：{submission.requestId || "本地演示"}</p>
                <p className="mt-1 text-stone-500">提交时间：{new Date(submission.submittedAt).toLocaleString("zh-CN")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">暂无提交记录。发布需求或提交入驻申请后会显示在这里。</p>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-stone-50 p-4">
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className="mt-1 font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return window.localStorage.getItem(authStorageKey) || "";
}

function getSubmissionsSnapshot() {
  return window.localStorage.getItem("jiuzhang:submissions") || "";
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
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}
