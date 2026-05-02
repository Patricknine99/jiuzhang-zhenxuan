import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 py-12">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-950 text-xs font-bold text-white font-serif">
              甄
            </span>
            <span className="font-serif font-bold">九章甄选</span>
            <span className="text-sm text-stone-400">© {new Date().getFullYear()}</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-stone-500">
            <Link href="/buyers" className="hover:text-stone-950">
              需求方入口
            </Link>
            <Link href="/creators" className="hover:text-stone-950">
              供给方入口
            </Link>
            <Link href="/provider-agreement" className="hover:text-stone-950">
              服务商协议
            </Link>
            <Link href="/privacy" className="hover:text-stone-950">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-stone-950">
              用户协议
            </Link>
            <Link href="/sla" className="hover:text-stone-950">
              验收标准
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs leading-6 text-stone-400">
          本站所含 AI 生成内容均应按《人工智能生成合成内容标识办法》要求标注 · 探索可靠的 AI 商业交付
        </p>
      </div>
    </footer>
  );
}
