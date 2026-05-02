"use client";

import Link from "next/link";

export default function ErrorPage({
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center md:py-32">
      <p className="font-serif text-8xl font-black text-stone-200">出错了</p>
      <h1 className="mt-6 text-2xl font-bold text-stone-900">页面加载异常</h1>
      <p className="mt-3 text-sm leading-7 text-stone-500">
        当前页面遇到了意外错误，请尝试刷新页面或返回首页。
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 hover:border-stone-400 hover:bg-white"
        >
          重试
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
