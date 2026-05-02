"use client";

import Script from "next/script";
import { useEffect, useId } from "react";

declare global {
  interface Window {
    jiuzhangTurnstileCallback?: (token: string) => void;
  }
}

export function TurnstileField() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const inputId = useId();

  useEffect(() => {
    window.jiuzhangTurnstileCallback = (token: string) => {
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      if (input) input.value = token;
    };
    return () => {
      delete window.jiuzhangTurnstileCallback;
    };
  }, [inputId]);

  if (!siteKey) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <input id={inputId} name="captchaToken" type="hidden" />
      <div className="cf-turnstile" data-sitekey={siteKey} data-callback="jiuzhangTurnstileCallback" />
      <p className="mt-2 text-xs leading-5 text-stone-500">已启用防机器人校验。生产环境需同时配置 relay 的 Turnstile secret。</p>
    </div>
  );
}
