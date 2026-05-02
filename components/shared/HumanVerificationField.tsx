"use client";

import { useState } from "react";

export function HumanVerificationField() {
  const provider = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER;
  const [checked, setChecked] = useState(false);

  if (!provider) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <label className="flex items-start gap-3 text-sm leading-6 text-stone-700">
        <input
          className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <span>
          我不是自动提交程序
          <span className="block text-xs text-stone-500">
            当前仅预留国内验证码接入位。正式上线可接腾讯云验证码、阿里云验证码或极验，不加载境外验证码脚本。
          </span>
        </span>
      </label>
      <input name="captchaToken" type="hidden" value={checked ? `local-human-check:${provider}` : ""} readOnly />
    </div>
  );
}
