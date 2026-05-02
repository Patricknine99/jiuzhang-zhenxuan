import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const metadata: Metadata = {
  title: "注册",
  description: "注册九章甄选账号，当前支持手机号和邮箱，微信注册接口已预留。"
};

export default function RegisterPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:px-6 md:py-20">
      <div>
        <div className="accent-line mb-5" />
        <h1 className="text-3xl font-bold md:text-5xl">创建账号</h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">
          注册时需要设置基础密码，并通过手机或邮箱验证码确认账号归属；注册成功后当前设备会被标记为已信任。
        </p>
        <p className="mt-6 text-sm text-stone-500">
          已有账号？{" "}
          <Link href="/login?role=buyer" className="font-semibold text-[var(--color-brand)]">
            去登录
          </Link>
        </p>
      </div>
      <AuthPanel mode="register" />
    </div>
  );
}
