"use client";

import { useMemo, useState } from "react";
import { Activity, ClipboardList, KeyRound, LockKeyhole, ShieldCheck, UserCog, WalletCards } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  adminRoleLabels,
  adminSessionStorageKey,
  hasAdminPermission,
  permissionLabels,
  rolePermissions,
  type AdminAccount,
  type AdminPermission,
  type AdminRole
} from "@/lib/admin";

type AdminSession = {
  token: string;
  account: AdminAccount;
  issuedAt: string;
  source: "relay" | "demo";
};

type Submission = {
  type: "demand" | "application";
  requestId: string;
  ok: boolean;
  partialFailure?: boolean;
  submittedAt: string;
  results: Array<{ ok: boolean; channel: string; message: string }>;
};

type AdminRelayResponse = {
  ok?: boolean;
  token?: string;
  account?: AdminAccount;
  message?: string;
  error?: { message?: string };
};

const priorityTasks = [
  "核查今日新增企业需求，24 小时内完成首次联系",
  "处理服务商入驻申请，补齐案例链接和开票信息",
  "检查飞书、企业微信、钉钉分发是否有 partialFailure",
  "付款前核对合同主体、预算、里程碑和发票信息",
  "敏感操作后查看审计记录，确认操作者和时间"
];

export function AdminConsole() {
  const [session, setSession] = useState<AdminSession | null>(() => readAdminSession());
  const [email, setEmail] = useState("admin@jiuzhang.local");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissions = useMemo(() => readSubmissions(), []);

  if (!session) {
    return (
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-semibold text-[var(--color-brand)]">Admin Console</p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">后台管理员</h1>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            给客服、运营、财务和管理员使用的后台入口。默认按最小权限设计，不同角色看到的操作范围不同。
          </p>
          <div className="mt-8 grid gap-3 text-sm text-stone-600">
            <AdminNote icon={<ShieldCheck className="h-4 w-4" />} text="生产环境通过 relay 校验管理员账号，不在浏览器里保存管理员密码。" />
            <AdminNote icon={<LockKeyhole className="h-4 w-4" />} text="本地未配置 relay 时仅开放演示账号，方便非技术人员预览后台。" />
            <AdminNote icon={<Activity className="h-4 w-4" />} text="后台已预留操作审计、渠道健康、线索分配和付款审核模块。" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 md:p-8">
          <h2 className="text-xl font-bold">管理员登录</h2>
          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setMessage("");
              setIsSubmitting(true);
              try {
                const nextSession = await loginAdmin(email, password);
                setSession(nextSession);
                window.localStorage.setItem(adminSessionStorageKey, JSON.stringify(nextSession));
                setMessage("登录成功。");
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "登录失败，请稍后重试。");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-stone-700">管理员邮箱</span>
              <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-stone-700">密码</span>
              <input className="field" value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
            </label>
            <p className="text-xs leading-5 text-stone-500">
              演示模式账号：`admin@jiuzhang.local`，密码：`AdminDemo123!`。生产环境请配置 relay 管理员环境变量。
            </p>
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
            <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? <LoadingSpinner /> : <KeyRound className="h-4 w-4" />}
              {isSubmitting ? "登录中" : "进入后台"}
            </button>
          </form>
        </section>
      </div>
    );
  }

  const account = session.account;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-[var(--color-brand)]">后台控制台</p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">欢迎，{account.name}</h1>
          <p className="mt-4 text-stone-600">
            当前角色：{adminRoleLabels[account.role]}。登录来源：{session.source === "relay" ? "relay 管理员服务" : "本地演示模式"}。
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
          onClick={() => {
            window.localStorage.removeItem(adminSessionStorageKey);
            setSession(null);
          }}
        >
          退出后台
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={<ClipboardList className="h-5 w-5" />} label="待处理线索" value={String(submissions.length)} />
        <MetricCard icon={<UserCog className="h-5 w-5" />} label="当前角色" value={adminRoleLabels[account.role]} />
        <MetricCard icon={<ShieldCheck className="h-5 w-5" />} label="权限数量" value={String(account.permissions.length)} />
        <MetricCard icon={<WalletCards className="h-5 w-5" />} label="支付模块" value={hasAdminPermission(account, "payments:review") ? "可查看" : "无权限"} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">线索处理队列</h2>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">本地最近 10 条</span>
          </div>
          {hasAdminPermission(account, "leads:read") ? <LeadQueue submissions={submissions} canAssign={hasAdminPermission(account, "leads:assign")} /> : <NoPermission />}
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">今日优先事项</h2>
          <div className="mt-5 space-y-3">
            {priorityTasks.map((task) => (
              <label key={task} className="flex gap-3 rounded-xl bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-brand)]" />
                {task}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PermissionMatrix role={account.role} />
        <AuditPreview account={account} />
      </section>
    </div>
  );
}

function AdminNote({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <span className="mt-1 text-[var(--color-brand)]">{icon}</span>
      <span className="leading-6">{text}</span>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <div className="text-[var(--color-brand)]">{icon}</div>
      <p className="mt-4 text-xs font-semibold text-stone-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function LeadQueue({ submissions, canAssign }: { submissions: Submission[]; canAssign: boolean }) {
  if (submissions.length === 0) {
    return <p className="mt-5 rounded-xl bg-stone-50 p-4 text-sm text-stone-500">暂无本地提交记录。真实后台接入数据库后会展示全量待办。</p>;
  }
  return (
    <div className="mt-5 space-y-3">
      {submissions.map((submission) => (
        <div key={`${submission.requestId}-${submission.submittedAt}`} className="rounded-xl border border-stone-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold">{submission.type === "demand" ? "企业需求" : "服务商入驻"}</span>
            <span className={submission.ok && !submission.partialFailure ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-amber-700"}>
              {submission.ok && !submission.partialFailure ? "已分发" : "需复核"}
            </span>
          </div>
          <p className="mt-2 break-all text-xs text-stone-500">请求编号：{submission.requestId || "static-demo"}</p>
          <p className="mt-1 text-xs text-stone-500">提交时间：{new Date(submission.submittedAt).toLocaleString("zh-CN")}</p>
          {canAssign ? <button className="mt-3 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700">标记已分配</button> : null}
        </div>
      ))}
    </div>
  );
}

function PermissionMatrix({ role }: { role: AdminRole }) {
  const active = new Set(rolePermissions[role]);
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
      <h2 className="text-xl font-bold">权限矩阵</h2>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {(Object.keys(permissionLabels) as AdminPermission[]).map((permission) => (
          <div key={permission} className={`rounded-xl px-4 py-3 text-sm ${active.has(permission) ? "bg-emerald-50 text-emerald-800" : "bg-stone-50 text-stone-400"}`}>
            {permissionLabels[permission]}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditPreview({ account }: { account: AdminAccount }) {
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
      <h2 className="text-xl font-bold">审计预览</h2>
      <div className="mt-5 space-y-3 text-sm">
        <AuditRow label="管理员登录" value={`${account.email} / ${new Date().toLocaleString("zh-CN")}`} />
        <AuditRow label="权限角色" value={adminRoleLabels[account.role]} />
        <AuditRow label="下一步" value="接入数据库后记录每次分配、审核、支付复核和系统设置变更。" />
      </div>
    </div>
  );
}

function AuditRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-stone-50 p-4">
      <p className="text-xs font-semibold text-stone-400">{label}</p>
      <p className="mt-1 leading-6 text-stone-700">{value}</p>
    </div>
  );
}

function NoPermission() {
  return <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">当前角色无权查看该模块。</p>;
}

async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const relayUrl = process.env.NEXT_PUBLIC_ADMIN_RELAY_URL;
  if (!relayUrl) {
    await delay(350);
    if (email.trim().toLowerCase() !== "admin@jiuzhang.local" || password !== "AdminDemo123!") {
      throw new Error("演示账号或密码不正确。");
    }
    return {
      token: "demo-admin-session",
      source: "demo",
      issuedAt: new Date().toISOString(),
      account: {
        id: "admin_demo_owner",
        email: "admin@jiuzhang.local",
        name: "演示管理员",
        role: "owner",
        permissions: rolePermissions.owner,
        createdAt: new Date().toISOString()
      }
    };
  }

  const response = await fetch(`${relayUrl.replace(/\/$/, "")}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const body = (await response.json().catch(() => null)) as AdminRelayResponse | null;
  if (!response.ok || body?.ok === false || !body?.account || !body?.token) {
    throw new Error(body?.error?.message || body?.message || "管理员登录失败");
  }
  return {
    token: body.token,
    account: body.account,
    source: "relay",
    issuedAt: new Date().toISOString()
  };
}

function readAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(adminSessionStorageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    window.localStorage.removeItem(adminSessionStorageKey);
    return null;
  }
}

function readSubmissions(): Submission[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem("jiuzhang:submissions") || "[]") as Submission[];
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
