import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center md:py-32">
      <p className="font-serif text-8xl font-black text-stone-200">404</p>
      <h1 className="mt-6 text-2xl font-bold text-stone-900">页面未找到</h1>
      <p className="mt-3 text-sm leading-7 text-stone-500">
        您访问的页面不存在或已被移除。试试从首页开始浏览。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]"
      >
        返回首页
      </Link>
    </div>
  );
}
