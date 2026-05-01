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
          企业用户可以保存需求诊断，服务商可以继续提交入驻申请。当前账号数据保存在本地，后续接真实用户系统。
        </p>
        <p className="mt-6 text-sm text-stone-500">
          已有账号？{" "}
          <Link href="/login" className="font-semibold text-[var(--color-brand)]">
            去登录
          </Link>
        </p>
      </div>
      <AuthPanel mode="register" />
    </div>
  );
}
