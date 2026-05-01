"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, ClipboardList, Send } from "lucide-react";

type Message = {
  role: "ai" | "user";
  text: string;
};

const questions = [
  "你现在最想用 AI 解决哪个业务问题？",
  "这个问题目前每月大概消耗多少人力、时间或预算？",
  "你希望多久看到第一版 Demo？",
  "你更看重降本、提效、增长，还是风险控制？"
];

export function DiagnosisWorkspace() {
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiNote, setAiNote] = useState("");

  const currentQuestion = questions[answers.length] || "";
  const messages = useMemo<Message[]>(() => {
    const items: Message[] = [
      {
        role: "ai",
        text: "我是九章甄选的 AI 需求诊断助手。先用 4 个问题帮你把需求边界、预算和匹配方向整理出来。"
      }
    ];
    answers.forEach((answer, index) => {
      items.push({ role: "ai", text: questions[index] });
      items.push({ role: "user", text: answer });
    });
    if (currentQuestion) items.push({ role: "ai", text: currentQuestion });
    return items;
  }, [answers, currentQuestion]);

  const summary = buildSummary(answers);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200 md:p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-stone-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-[var(--color-brand)]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold">AI 需求诊断</h1>
            <p className="text-sm text-stone-500">当前为本地诊断流程，已预留自有 AI 接口。</p>
          </div>
        </div>

        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === "user" ? "bg-[var(--color-brand)] text-white" : "bg-stone-100 text-stone-700"}`}>
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {currentQuestion ? (
          <form
            className="mt-6 grid grid-cols-[1fr_auto] gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!input.trim()) return;
              const nextAnswers = [...answers, input.trim()];
              setAnswers(nextAnswers);
              setInput("");
              if (nextAnswers.length === questions.length) {
                setIsLoading(true);
                setAiNote(await requestDiagnosis(nextAnswers));
                setIsLoading(false);
              }
            }}
          >
            <input className="field" value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入你的回答" />
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 font-semibold text-white">
              <Send className="h-4 w-4" />
              发送
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            诊断已完成。你可以继续发布正式需求，平台会带着这份摘要跟进。
          </div>
        )}
      </section>

      <aside className="rounded-2xl bg-stone-950 p-6 text-white">
        <div className="mb-5 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-orange-200" />
          <h2 className="font-bold">诊断摘要</h2>
        </div>
        <div className="space-y-4 text-sm leading-7 text-stone-300">
          {summary.map((item) => (
            <div key={item.label} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-xs text-stone-400">{item.label}</p>
              <p className="mt-1 text-stone-100">{item.value || "待补充"}</p>
            </div>
          ))}
        </div>
        {isLoading ? <p className="mt-5 text-sm text-orange-200">正在调用 AI 接口预留层...</p> : null}
        {aiNote ? <p className="mt-5 rounded-xl bg-orange-300/10 p-4 text-sm leading-7 text-orange-100">{aiNote}</p> : null}
        <Link
          href={`/post-demand?diagnosis=${encodeURIComponent(answers.join(" / "))}`}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-3.5 font-semibold text-white hover:bg-[var(--color-brand-hover)]"
        >
          带着诊断发布需求 <ArrowRight className="h-4 w-4" />
        </Link>
      </aside>
    </div>
  );
}

function buildSummary(answers: string[]) {
  return [
    { label: "业务问题", value: answers[0] },
    { label: "当前成本", value: answers[1] },
    { label: "期望周期", value: answers[2] },
    { label: "优先目标", value: answers[3] }
  ];
}

async function requestDiagnosis(answers: string[]) {
  const endpoint = process.env.NEXT_PUBLIC_DIAGNOSIS_AI_URL;
  if (!endpoint) {
    return "AI 接口未配置：当前使用本地摘要。后续配置 NEXT_PUBLIC_DIAGNOSIS_AI_URL 后，可把这 4 个回答发送到自有 AI 服务生成更完整的 PRD。";
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers })
    });
    const data = await response.json().catch(() => null);
    return data?.message || "AI 已返回诊断结果，后续可在这里渲染结构化 PRD。";
  } catch {
    return "AI 接口暂时不可用，已保留本地摘要，可继续提交人工诊断。";
  }
}
