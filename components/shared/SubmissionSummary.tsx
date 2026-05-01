"use client";

import { useSyncExternalStore } from "react";

type Submission = {
  type: "demand" | "application";
  requestId: string;
  ok: boolean;
  submittedAt: string;
  results: Array<{
    ok: boolean;
    channel: string;
    message: string;
  }>;
};

export function SubmissionSummary({ expectedType }: { expectedType: Submission["type"] }) {
  const raw = useSyncExternalStore(subscribeToStorage, getSubmissionSnapshot, getServerSnapshot);
  const submission = parseSubmission(raw, expectedType);

  if (!submission) return null;

  return (
    <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 text-left">
      <p className="text-sm font-semibold text-stone-950">提交记录</p>
      <dl className="mt-3 space-y-2 text-sm text-stone-600">
        <div className="flex justify-between gap-4">
          <dt>请求编号</dt>
          <dd className="break-all text-right font-medium text-stone-900">{submission.requestId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>提交时间</dt>
          <dd>{new Date(submission.submittedAt).toLocaleString("zh-CN")}</dd>
        </div>
      </dl>
      {submission.results.length > 0 ? (
        <div className="mt-4 space-y-2">
          {submission.results.map((result) => (
            <div key={`${result.channel}-${result.message}`} className="flex items-start justify-between gap-4 rounded-xl bg-stone-50 px-3 py-2 text-sm">
              <span className="font-medium text-stone-700">{result.channel}</span>
              <span className={result.ok ? "text-emerald-700" : "text-red-700"}>{result.message}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSubmissionSnapshot() {
  return window.sessionStorage.getItem("jiuzhang:lastLeadSubmission") || "";
}

function getServerSnapshot() {
  return "";
}

function parseSubmission(raw: string, expectedType: Submission["type"]) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Submission;
    return parsed.type === expectedType ? parsed : null;
  } catch {
    return null;
  }
}
