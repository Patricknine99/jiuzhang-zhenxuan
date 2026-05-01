"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Headphones, MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
  role: "ai" | "user" | "system";
  text: string;
};

export function FloatingSupport() {
  const [open, setOpen] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "你好，我是九章甄选 AI 客服。可以帮你判断需求方向、找服务商，必要时转人工。"
    }
  ]);

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      {open ? (
        <div className="mb-3 w-[calc(100vw-40px)] max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-950/20">
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
          <div className="max-h-80 space-y-3 overflow-y-auto p-4">
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
          </div>
          <div className="border-t border-stone-100 p-3">
            <div className="mb-2 flex gap-2">
              <button type="button" className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600" onClick={() => quickAsk("我想找服务商")}>
                找服务商
              </button>
              <button type="button" className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600" onClick={() => quickAsk("我想做 AI 诊断")}>
                AI 诊断
              </button>
              <button type="button" className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600" onClick={() => setHandoff(true)}>
                转人工
              </button>
            </div>
            <form
              className="grid grid-cols-[1fr_auto] gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!input.trim()) return;
                quickAsk(input.trim());
                setInput("");
              }}
            >
              <input className="field py-2 text-sm" value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入你的问题" />
              <button type="submit" className="rounded-xl bg-[var(--color-brand)] px-3 text-white">
                <Send className="h-4 w-4" />
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

  function quickAsk(text: string) {
    setMessages((current) => [
      ...current,
      { role: "user", text },
      { role: "ai", text: getLocalReply(text) }
    ]);
  }
}

function getLocalReply(text: string) {
  if (text.includes("服务商")) return "可以先看服务类型或服务商库。如果你描述行业、预算和交付周期，我也可以建议筛选方向。";
  if (text.includes("诊断")) return "建议进入 AI 需求诊断页，先回答 4 个问题，系统会生成可提交给平台的摘要。";
  if (text.includes("登录") || text.includes("注册")) return "账号入口已支持手机号和邮箱，微信、企业微信、飞书已预留接口。";
  return "我已记录你的问题。当前 AI 客服使用本地预设回复，后续可通过 NEXT_PUBLIC_SUPPORT_AI_URL 接入自有 AI。复杂问题建议点击“转人工”。";
}
