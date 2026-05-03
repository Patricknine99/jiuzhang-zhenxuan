import Link from "next/link";
import { ChevronDown, LogIn, Send, ShieldCheck, Users } from "lucide-react";
import { industryCategories, serviceCategories } from "@/lib/catalog";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 md:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="九章甄选首页">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-950 text-sm font-bold text-white font-serif">
            甄
          </span>
          <span className="font-serif text-lg font-bold tracking-normal sm:text-xl">九章甄选</span>
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          <Dropdown
            label="需求方"
            primaryHref="/buyers"
            groups={[
              {
                title: "需求方工作台",
                links: [
                  { href: "/buyers", label: "需求方入口", description: "从诊断、匹配到验收的完整路径。" },
                  { href: "/buyers/dashboard", label: "我的工作台", description: "已登录需求方查看提交记录与跟进状态。" },
                  { href: "/login?role=buyer", label: "需求方登录", description: "进入企业买家系统，查看需求与跟进记录。" },
                  { href: "/diagnosis", label: "AI 需求诊断", description: "先把模糊业务问题拆成可执行方案。" },
                  { href: "/post-demand", label: "发布需求", description: "提交预算、周期和业务痛点，等待平台跟进。" }
                ]
              },
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
            label="供给方"
            primaryHref="/creators"
            groups={[
              {
                title: "服务商入口",
                links: [
                  { href: "/creators", label: "供给方入口", description: "了解认证、案例包装和接单路径。" },
                  { href: "/creators/dashboard", label: "我的工作台", description: "已登录供给方查看入驻状态与接单机会。" },
                  { href: "/login?role=provider", label: "供给方登录", description: "进入服务商系统，查看入驻与接单准备。" },
                  { href: "/join", label: "服务商入驻", description: "提交团队信息、案例、技术栈和预算区间。" },
                  { href: "/provider-agreement", label: "服务商协议", description: "查看交付、版权、验收与平台规则。" }
                ]
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
          <Link className="hidden items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-950 lg:inline-flex" href="/creators">
            <Users className="h-4 w-4" />
            供给方
          </Link>
          <Link className="hidden items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-950 sm:inline-flex" href="/login?role=buyer">
            <LogIn className="h-4 w-4" />
            登录
          </Link>
          <Link className="hidden items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-950 xl:inline-flex" href="/admin">
            <ShieldCheck className="h-4 w-4" />
            后台
          </Link>
          <Link
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--color-brand)] px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-900/10 hover:bg-[var(--color-brand-hover)] sm:gap-2 sm:px-4"
            href="/diagnosis"
          >
            <Send className="h-4 w-4" />
            <span className="hidden min-[360px]:inline">AI 诊断</span>
            <span className="min-[360px]:hidden">诊断</span>
          </Link>
        </div>
      </nav>
      <nav className="border-t border-stone-200 px-4 py-2 md:hidden" aria-label="移动端主导航">
        <div className="mobile-scrollbar mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto whitespace-nowrap text-sm font-medium text-stone-600">
          <Link href="/providers" className="flex min-h-10 shrink-0 items-center rounded-lg px-2.5 hover:bg-stone-100 hover:text-stone-950">
            服务商
          </Link>
          <Link href="/buyers" className="flex min-h-10 shrink-0 items-center rounded-lg px-2.5 hover:bg-stone-100 hover:text-stone-950">
            需求方
          </Link>
          <Link href="/creators" className="flex min-h-10 shrink-0 items-center rounded-lg px-2.5 hover:bg-stone-100 hover:text-stone-950">
            供给方
          </Link>
          <Link href="/services" className="flex min-h-10 shrink-0 items-center rounded-lg px-2.5 hover:bg-stone-100 hover:text-stone-950">
            服务类型
          </Link>
          <Link href="/industries" className="flex min-h-10 shrink-0 items-center rounded-lg px-2.5 hover:bg-stone-100 hover:text-stone-950">
            行业方案
          </Link>
          <Link href="/cases" className="flex min-h-10 shrink-0 items-center rounded-lg px-2.5 hover:bg-stone-100 hover:text-stone-950">
            商业案例
          </Link>
          <Link href="/sla" className="flex min-h-10 shrink-0 items-center rounded-lg px-2.5 hover:bg-stone-100 hover:text-stone-950">
            验收标准
          </Link>
          <Link href="/login?role=buyer" className="flex min-h-10 shrink-0 items-center rounded-lg px-2.5 hover:bg-stone-100 hover:text-stone-950">
            登录
          </Link>
          <Link href="/admin" className="flex min-h-10 shrink-0 items-center rounded-lg px-2.5 hover:bg-stone-100 hover:text-stone-950">
            后台
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
