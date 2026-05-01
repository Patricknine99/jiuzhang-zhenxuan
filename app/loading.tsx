import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-5 py-20 md:px-6">
      <div className="rounded-2xl bg-white px-8 py-7 text-center ring-1 ring-stone-200">
        <LoadingSpinner className="mx-auto h-8 w-8 text-[var(--color-brand)]" />
        <p className="mt-4 font-semibold text-stone-900">页面加载中</p>
        <p className="mt-2 text-sm text-stone-500">网络较慢时请稍等片刻。</p>
      </div>
    </div>
  );
}
