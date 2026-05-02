import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const metadata: Metadata = {
  title: "登录",
  description: "使用手机号或邮箱登录九章甄选，微信、企业微信、飞书登录接口已预留。"
};

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:px-6 md:py-20">
      <div>
        <div className="accent-line mb-5" />
        <h1 className="text-3xl font-bold md:text-5xl">登录账号</h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">
          使用手机号或邮箱加密码登录。首次在这台设备登录时，需要再输入短信或邮箱验证码完成设备确认。
        </p>
        <p className="mt-6 text-sm text-stone-500">
          还没有账号？{" "}
          <Link href="/register" className="font-semibold text-[var(--color-brand)]">
            去注册
          </Link>
        </p>
      </div>
      <AuthPanel mode="login" />
    </div>
  );
}
