import Link from "next/link";
import { Send } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="九章甄选首页">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-950 text-sm font-bold text-white font-serif">
            甄
          </span>
          <span className="font-serif text-xl font-bold tracking-normal">九章甄选</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link className="text-sm font-medium text-stone-600 hover:text-stone-950" href="/providers">
            找服务商
          </Link>
          <Link className="text-sm font-medium text-stone-600 hover:text-stone-950" href="/cases">
            商业案例
          </Link>
          <Link className="text-sm font-medium text-stone-600 hover:text-stone-950" href="/sla">
            验收标准
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link className="hidden text-sm font-medium text-stone-600 hover:text-stone-950 sm:block" href="/join">
            服务商入驻
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-900/10 hover:bg-[var(--color-brand-hover)]"
            href="/post-demand"
          >
            <Send className="h-4 w-4" />
            发布需求
          </Link>
        </div>
      </nav>
      <nav className="border-t border-stone-200 px-5 py-2 md:hidden" aria-label="移动端主导航">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm font-medium text-stone-600">
          <Link href="/providers" className="rounded-lg px-2 py-1.5 hover:bg-stone-100 hover:text-stone-950">
            找服务商
          </Link>
          <Link href="/cases" className="rounded-lg px-2 py-1.5 hover:bg-stone-100 hover:text-stone-950">
            商业案例
          </Link>
          <Link href="/sla" className="rounded-lg px-2 py-1.5 hover:bg-stone-100 hover:text-stone-950">
            验收标准
          </Link>
        </div>
      </nav>
    </header>
  );
}
