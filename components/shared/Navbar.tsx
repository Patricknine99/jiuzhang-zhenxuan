import Link from "next/link";
import { ChevronDown, Send } from "lucide-react";
import { industryCategories, serviceCategories } from "@/lib/catalog";

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
        <div className="hidden items-center gap-7 md:flex">
          <Dropdown
            label="找服务商"
            primaryHref="/providers"
            groups={[
              {
                title: "按服务类型",
                links: serviceCategories.map((category) => ({
                  href: `/services/${category.slug}`,
                  label: category.shortTitle,
                  description: category.description
                }))
              },
              {
                title: "按行业",
                links: industryCategories.map((category) => ({
                  href: `/industries/${category.slug}`,
                  label: category.title,
                  description: category.description
                }))
              }
            ]}
          />
          <Dropdown
            label="商业案例"
            primaryHref="/cases"
            groups={[
              {
                title: "案例入口",
                links: [
                  { href: "/cases", label: "全部案例", description: "按行业、服务类型和效果筛选案例。" },
                  { href: "/services/ecommerce-visuals", label: "电商视觉案例", description: "商品图、短视频和批量素材工作流。" },
                  { href: "/services/private-knowledge", label: "知识库案例", description: "RAG、内部检索和企业知识复用。" }
                ]
              }
            ]}
          />
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 text-sm font-medium text-stone-600">
          <Link href="/providers" className="rounded-lg px-2 py-1.5 hover:bg-stone-100 hover:text-stone-950">
            找服务商
          </Link>
          <Link href="/services" className="rounded-lg px-2 py-1.5 hover:bg-stone-100 hover:text-stone-950">
            服务类型
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

function Dropdown({
  label,
  primaryHref,
  groups
}: {
  label: string;
  primaryHref: string;
  groups: Array<{
    title: string;
    links: Array<{
      href: string;
      label: string;
      description: string;
    }>;
  }>;
}) {
  return (
    <div className="group relative">
      <Link className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-950" href={primaryHref}>
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-50 w-[680px] -translate-x-1/2 pt-4 opacity-0 transition group-hover:visible group-hover:opacity-100">
        <div className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-xl shadow-stone-950/10 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-3 text-xs font-semibold text-stone-400">{group.title}</p>
              <div className="space-y-1">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2.5 hover:bg-stone-50">
                    <span className="text-sm font-semibold text-stone-900">{link.label}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-stone-500">{link.description}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
