"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Send, X } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_CHIPS = [
  "How does the 14-day trial work?",
  "Do I need an LLM API key?",
  "What do you sell?",
  "Does HARMEK support WhatsApp?",
];

/**
 * Floating interactive chat widget featuring the official HARMEK AI mascot.
 * Powered live by HARMEK AI's Native Intelligence Engine (/api/public/demo-chat).
 */
export function FloatingMascotChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [stateContext, setStateContext] = useState<Record<string, unknown>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I am HARMEK. Ask me about our 14-day free trial, pricing, Native Engine, or how HARMEK helps your business.",
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function sendQuestion(rawText: string) {
    const content = rawText.trim();
    if (!content || sending) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content },
    ]);
    setSending(true);

    try {
      const res = await fetch("/api/public/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, stateContext }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.reply) {
        if (data.updatedState) setStateContext(data.updatedState);
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content:
              data.error ||
              "I could not reach the assistant right now. Please try again in a moment.",
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Slide-Up Chat Window */}
      <div
        className={`mb-3 w-[360px] max-w-[calc(100vw-2rem)] origin-bottom-right overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#061218]/95 shadow-[0_24px_64px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open
            ? "pointer-events-auto scale-100 opacity-100 translate-y-0"
            : "pointer-events-none scale-95 opacity-0 translate-y-3 h-0 mb-0 border-0"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-300/15 bg-gradient-to-r from-[#081C24] to-[#0B2832] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="relative h-10 w-10 overflow-hidden rounded-full border border-cyan-300/50 bg-white">
              <Image
                src="/harmek-mascot.jpg"
                alt="HARMEK AI mascot"
                fill
                sizes="40px"
                className="object-cover object-top"
              />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">HARMEK AI</p>
              <p className="flex items-center gap-1.5 text-[11px] text-cyan-200/85">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Native Engine Live
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close HARMEK chat"
            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-72 space-y-3 overflow-y-auto px-4 py-3.5 text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                  m.role === "user"
                    ? "bg-cyan-400 text-[#041318] font-medium"
                    : "border border-cyan-300/15 bg-[#0A1E27] text-slate-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending ? (
            <div className="flex items-center gap-2 text-xs text-cyan-200/80">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              HARMEK is thinking...
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {/* Quick Reply Chips */}
        <div className="flex flex-wrap gap-1.5 border-t border-cyan-300/10 bg-[#050E13] px-3 pt-2.5 pb-1.5">
          {STARTER_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={sending}
              onClick={() => sendQuestion(chip)}
              className="rounded-full border border-cyan-300/20 bg-[#081820] px-2.5 py-1 text-[11px] text-cyan-100 transition-colors hover:border-cyan-300/60 hover:bg-[#0D2530] disabled:opacity-50 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="flex items-center gap-2 border-t border-cyan-300/15 bg-[#050E13] p-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask HARMEK anything..."
            className="h-9 flex-1 rounded-lg border border-cyan-300/20 bg-[#08161D] px-3 text-xs text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 text-[#041318] transition-colors hover:bg-cyan-300 disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        <div className="border-t border-cyan-300/10 bg-[#040B0F] px-3 py-2 text-center text-[11px] text-slate-400">
          Want this on your website?{" "}
          <Link href="/get-started" className="font-medium text-cyan-300 hover:underline">
            Start 14-day free trial
          </Link>
        </div>
      </div>

      {/* Floating Mascot Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close HARMEK AI chat" : "Chat with HARMEK AI mascot"}
        className="group relative flex items-center gap-2.5 rounded-full border border-cyan-300/40 bg-[#071820]/95 p-1.5 pr-4 shadow-[0_12px_36px_rgba(6,182,212,0.28)] backdrop-blur-md transition-all hover:scale-[1.03] hover:border-cyan-300/75 cursor-pointer animate-harmek-float"
      >
        <span className="relative h-12 w-12 overflow-hidden rounded-full border border-cyan-300/50 bg-white">
          <Image
            src="/harmek-mascot.jpg"
            alt="HARMEK AI mascot"
            fill
            sizes="48px"
            className="object-cover object-top"
          />
        </span>
        <div className="text-left">
          <p className="text-xs font-semibold text-white">Ask HARMEK</p>
          <p className="text-[10px] text-cyan-200/85">Live assistant</p>
        </div>
        <span
          aria-hidden="true"
          className="absolute -top-0.5 left-10 h-3 w-3 rounded-full bg-cyan-400 ring-2 ring-[#071820]"
        />
      </button>
    </div>
  );
}
