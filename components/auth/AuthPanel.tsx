"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import { authStorageKey, createLocalAccount, getOrCreateAuthDeviceId, isValidEmail, isValidPhone, type LocalAccount } from "@/lib/auth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TurnstileField } from "@/components/shared/TurnstileField";

type AuthMode = "login" | "register";
type Method = "email" | "phone";
type AuthRelayResponse = {
  ok?: boolean;
  requestId?: string;
  devCode?: string;
  account?: LocalAccount;
  requiresVerification?: boolean;
  message?: string;
  error?: { message?: string };
};

export function AuthPanel({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isRegister = mode === "register";
  const [method, setMethod] = useState<Method>("phone");
  const [role, setRole] = useState<LocalAccount["role"]>("buyer");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [needsVerification, setNeedsVerification] = useState(isRegister);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 md:p-8">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
        {[
          ["phone", "手机号"],
          ["email", "邮箱"]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${method === value ? "bg-white text-stone-950 shadow-sm" : "text-stone-500"}`}
            onClick={() => {
              setMethod(value as Method);
              setCode("");
              setNeedsVerification(isRegister);
              setError("");
              setMessage("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isRegister ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            ["buyer", UserRound, "企业用户"],
            ["provider", Building2, "服务商"]
          ].map(([value, Icon, label]) => (
            <button
              key={value as string}
              type="button"
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                role === value ? "border-orange-300 bg-amber-100 text-amber-900" : "border-stone-200 text-stone-600"
              }`}
              onClick={() => setRole(value as LocalAccount["role"])}
            >
              <Icon className="h-4 w-4" />
              {label as string}
            </button>
          ))}
        </div>
      ) : null}

      <form
        ref={formRef}
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (isSubmitting) return;
          setError("");
          setMessage("");
          const normalized = validateIdentifier(method, identifier);
          if (!normalized.ok) {
            setError(normalized.message);
            return;
          }
          if (password.length < 8) {
            setError("请输入至少 8 位密码。");
            return;
          }
          if (needsVerification && !/^\d{6}$/.test(code.trim())) {
            setError(method === "phone" ? "请输入 6 位短信验证码。" : "请输入 6 位邮箱验证码。");
            return;
          }
          setIsSubmitting(true);
          try {
            const result = await verifyAuthSession({
              method,
              identifier: normalized.value,
              password,
              code: needsVerification ? code.trim() : undefined,
              role: isRegister ? role : "buyer",
              purpose: mode,
              captchaToken: getCaptchaToken(formRef.current),
              deviceId: getOrCreateAuthDeviceId()
            });
            if (result.requiresVerification) {
              setNeedsVerification(true);
              setMessage("这台设备首次登录该账号，需要获取并输入验证码。");
              return;
            }
            window.localStorage.setItem(authStorageKey, JSON.stringify(result.account));
            setMessage(isRegister ? "注册成功，正在进入账号页。" : "登录成功，正在进入账号页。");
            window.setTimeout(() => router.push("/account"), 350);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "登录失败，请稍后重试。");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">{method === "phone" ? "手机号" : "邮箱"}</span>
          <div className="relative">
            {method === "phone" ? <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" /> : <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />}
            <input
              className="field pl-10"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={method === "phone" ? "请输入中国大陆手机号" : "name@example.com"}
              type={method === "phone" ? "tel" : "email"}
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">密码</span>
          <input
            className="field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="至少 8 位"
            required
            disabled={isSubmitting}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </label>

        {needsVerification ? (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">{method === "phone" ? "短信验证码" : "邮箱验证码"}</span>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input className="field" value={code} onChange={(event) => setCode(event.target.value)} placeholder="6 位数字" inputMode="numeric" required disabled={isSubmitting} />
              <button
                type="button"
                disabled={isSendingCode}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={async () => {
                  setIsSendingCode(true);
                  setError("");
                  setMessage("");
                  const normalized = validateIdentifier(method, identifier);
                  if (!normalized.ok) {
                    setError(normalized.message);
                    setIsSendingCode(false);
                    return;
                  }
                  try {
                    const result = await requestAuthCode({
                      method,
                      identifier: normalized.value,
                      purpose: mode,
                      captchaToken: getCaptchaToken(formRef.current)
                    });
                    setMessage(result.devCode ? `Dry-run 验证码：${result.devCode}。生产环境不会返回验证码。` : "验证码已提交发送，请注意查收。");
                  } catch (caught) {
                    setError(caught instanceof Error ? caught.message : "验证码发送失败，请稍后重试。");
                  } finally {
                    setIsSendingCode(false);
                  }
                }}
              >
                {isSendingCode ? <LoadingSpinner /> : null}
                {isSendingCode ? "发送中" : "获取验证码"}
              </button>
            </div>
          </label>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
            已信任设备可使用账号密码登录；如果服务端判断为新设备，会要求验证码二次确认。
          </div>
        )}

        <TurnstileField />

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

        <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? <LoadingSpinner /> : null}
          {isSubmitting ? "处理中，请稍候" : isRegister ? "创建账号" : needsVerification ? "验证并登录" : "账号密码登录"}
        </button>
      </form>

      <div className="mt-6 border-t border-stone-100 pt-5">
        <p className="mb-3 text-xs font-semibold text-stone-400">预留第三方登录</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <ReservedAuthButton label="微信" icon={<MessageCircle className="h-4 w-4" />} />
          <ReservedAuthButton label="企业微信" icon={<Building2 className="h-4 w-4" />} />
          <ReservedAuthButton label="飞书" icon={<MessageCircle className="h-4 w-4" />} />
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function requestAuthCode(input: { method: Method; identifier: string; purpose: AuthMode; captchaToken?: string }) {
  const relayUrl = process.env.NEXT_PUBLIC_AUTH_RELAY_URL;
  if (!relayUrl) {
    await delay(500);
    return { ok: true, devCode: "123456" } satisfies AuthRelayResponse;
  }
  const response = await fetch(`${relayUrl.replace(/\/$/, "")}/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const body = (await response.json().catch(() => null)) as AuthRelayResponse | null;
  if (!response.ok || body?.ok === false) throw new Error(body?.error?.message || body?.message || "验证码发送失败");
  return body || { ok: true };
}

async function verifyAuthSession(input: {
  method: Method;
  identifier: string;
  purpose: AuthMode;
  password: string;
  code?: string;
  role: LocalAccount["role"];
  captchaToken?: string;
  deviceId: string;
}): Promise<{ account: LocalAccount; requiresVerification?: false } | { requiresVerification: true }> {
  const relayUrl = process.env.NEXT_PUBLIC_AUTH_RELAY_URL;
  if (!relayUrl) {
    await delay(420);
    if (input.password.length < 8) throw new Error("静态演示模式密码至少 8 位。");
    const trustedKey = `jiuzhang:trusted-device:${input.method}:${input.identifier}`;
    const passwordKey = `jiuzhang:demo-password:${input.method}:${input.identifier}`;
    const trustedDevice = window.localStorage.getItem(trustedKey);
    const savedPassword = window.localStorage.getItem(passwordKey);
    if (input.purpose === "login" && savedPassword !== input.password) {
      throw new Error(savedPassword ? "账号或密码不正确。" : "静态演示模式请先注册一次。");
    }
    if (input.purpose === "register" || trustedDevice !== input.deviceId) {
      if (!input.code) return { requiresVerification: true };
      if (input.code !== "123456") throw new Error("静态演示模式验证码为 123456。配置 NEXT_PUBLIC_AUTH_RELAY_URL 后会改用服务端验证码。");
      if (input.purpose === "register") window.localStorage.setItem(passwordKey, input.password);
      window.localStorage.setItem(trustedKey, input.deviceId);
    }
    return { account: createLocalAccount(input.method, input.identifier, input.purpose === "register" ? input.role : "buyer") };
  }
  const response = await fetch(`${relayUrl.replace(/\/$/, "")}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const body = (await response.json().catch(() => null)) as AuthRelayResponse | null;
  if (response.status === 202 || body?.requiresVerification) return { requiresVerification: true };
  if (!response.ok || body?.ok === false || !body?.account) throw new Error(body?.error?.message || body?.message || "登录验证失败");
  return { account: body.account };
}

function getCaptchaToken(form: HTMLFormElement | null) {
  const value = form ? new FormData(form).get("captchaToken") : "";
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function ReservedAuthButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-400">
      {icon}
      {label}
    </button>
  );
}

function validateIdentifier(method: Method, value: string): { ok: true; value: string } | { ok: false; message: string } {
  if (method === "email") {
    if (!isValidEmail(value)) return { ok: false, message: "请输入有效邮箱地址。" };
    return { ok: true, value };
  }
  if (!isValidPhone(value)) return { ok: false, message: "请输入有效的中国大陆手机号。" };
  return { ok: true, value };
}
