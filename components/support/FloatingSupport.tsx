"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Headphones, MessageCircle, Send, X } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

type ChatMessage = {
  role: "ai" | "user" | "system";
  text: string;
};

export function FloatingSupport() {
  const [open, setOpen] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "你好，我是九章甄选 AI 客服。可以帮你判断需求方向、找服务商，必要时转人工。"
    }
  ]);

  return (
    <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[80] flex flex-col items-end sm:left-auto sm:right-5 sm:bottom-5">
      {open ? (
        <div className="mb-3 max-h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-950/20 sm:w-[calc(100vw-40px)] sm:max-w-sm">
          <div className="flex items-center justify-between bg-stone-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-200" />
              <div>
                <p className="text-sm font-bold">九章智能客服</p>
                <p className="text-xs text-stone-300">AI 优先 · 可转人工</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭客服窗">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[calc(100dvh-17rem-env(safe-area-inset-bottom))] min-h-40 space-y-3 overflow-y-auto p-4 sm:max-h-80">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-[var(--color-brand)] text-white"
                      : message.role === "system"
                        ? "bg-amber-50 text-amber-900"
                        : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {message.text}
                </span>
              </div>
            ))}
            {handoff ? (
              <div className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                已进入人工介入队列。当前版本会引导你留下需求，后续可接企业微信、飞书或工单系统。
                <Link href="/post-demand" className="mt-2 block font-semibold text-[var(--color-brand)]">
                  去填写需求表
                </Link>
              </div>
            ) : null}
            {isReplying ? (
              <div className="text-left">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-3 py-2 text-sm text-stone-600">
                  <LoadingSpinner />
                  AI 正在回复
                </span>
              </div>
            ) : null}
          </div>
          <div className="border-t border-stone-100 p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              <button type="button" disabled={isReplying} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 disabled:opacity-50" onClick={() => quickAsk("我想找服务商")}>
                找服务商
              </button>
              <button type="button" disabled={isReplying} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 disabled:opacity-50" onClick={() => quickAsk("我想做 AI 诊断")}>
                AI 诊断
              </button>
              <button type="button" className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600" onClick={() => setHandoff(true)}>
                转人工
              </button>
            </div>
            <form
              className="grid gap-2 sm:grid-cols-[1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                if (!input.trim() || isReplying) return;
                quickAsk(input.trim());
                setInput("");
              }}
            >
              <input className="field py-2 text-sm" value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入你的问题" disabled={isReplying} />
              <button type="submit" disabled={isReplying} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-brand)] px-3 text-white disabled:opacity-60">
                {isReplying ? <LoadingSpinner /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-xl shadow-orange-900/30"
        aria-label="打开智能客服"
      >
        {open ? <Headphones className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );

  async function quickAsk(text: string) {
    setMessages((current) => [...current, { role: "user", text }]);
    setIsReplying(true);
    const reply = await getSupportReply(text);
    setMessages((current) => [...current, { role: "ai", text: reply }]);
    setIsReplying(false);
  }
}

async function getSupportReply(text: string) {
  const endpoint = process.env.NEXT_PUBLIC_SUPPORT_AI_URL;
  if (!endpoint) {
    await delay(320);
    return getLocalReply(text);
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), getSupportTimeoutMs());
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
      signal: controller.signal
    }).finally(() => window.clearTimeout(timeout));
    const data = await response.json().catch(() => null);
    return data?.message || getLocalReply(text);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "AI 客服响应超时。你可以稍后重试，或点击“转人工”留下需求。";
    }
    return "AI 客服暂时不可用，我先用本地回复帮你兜底。复杂问题建议转人工。";
  }
}

function getLocalReply(text: string) {
  if (text.includes("服务商")) return "可以先看服务类型或服务商库。如果你描述行业、预算和交付周期，我也可以建议筛选方向。";
  if (text.includes("诊断")) return "建议进入 AI 需求诊断页，先回答 4 个问题，系统会生成可提交给平台的摘要。";
  if (text.includes("登录") || text.includes("注册")) return "账号入口已支持手机号和邮箱，微信、企业微信、飞书已预留接口。";
  return "我已记录你的问题。当前 AI 客服使用本地预设回复，后续可通过 NEXT_PUBLIC_SUPPORT_AI_URL 接入自有 AI。复杂问题建议点击“转人工”。";
}

function getSupportTimeoutMs() {
  const value = Number(process.env.NEXT_PUBLIC_SUPPORT_TIMEOUT_MS || 10000);
  return Number.isFinite(value) && value > 0 ? value : 10000;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
