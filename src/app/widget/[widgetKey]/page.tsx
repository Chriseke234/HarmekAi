"use client";

import { use, useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, Loader2, Send, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmberFox } from "@/components/brand/ember-fox";

interface WidgetConfig {
  businessName: string;
  assistantName: string;
  isActive: boolean;
  welcomeMessage: string;
  primaryColor: string;
  requireConsent: boolean;
}

interface WidgetMessage {
  id: string;
  sender_type: "customer" | "assistant" | "agent" | "system";
  content: string;
  created_at: string;
}

export default function WidgetEmbedPage({
  params,
}: {
  params: Promise<{ widgetKey: string }>;
}) {
  const { widgetKey } = use(params);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [consentChoiceMade, setConsentChoiceMade] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [humanHandling, setHumanHandling] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/widget/config?key=${encodeURIComponent(widgetKey)}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(d.error || "Widget could not be loaded.");
        }
        return r.json();
      })
      .then((cfg: WidgetConfig) => {
        setConfig(cfg);
        if (!cfg.requireConsent) {
          setConsentChoiceMade(true);
          startSession(false);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Widget error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetKey]);

  async function startSession(allowPersistence: boolean) {
    setConsentChoiceMade(true);
    const storageKey = `sage_visitor_${widgetKey}`;
    const existingToken =
      allowPersistence && typeof window !== "undefined"
        ? window.localStorage.getItem(storageKey)
        : null;

    const res = await fetch("/api/widget/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        widgetKey,
        visitorToken: existingToken,
        consentPersistence: allowPersistence,
      }),
    });

    if (!res.ok) {
      setError("Could not start chat session. Please try again.");
      return;
    }

    const data = await res.json();
    if (allowPersistence && data.visitorToken && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, data.visitorToken);
    }
    setConversationId(data.conversationId);
    setHumanHandling(Boolean(data.humanTakeover));
    setMessages(data.messages ?? []);
  }

  // Poll for live human agent replies while conversation is active
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(async () => {
      const res = await fetch(
        `/api/widget/messages?key=${encodeURIComponent(widgetKey)}&conversationId=${encodeURIComponent(
          conversationId
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        setHumanHandling(Boolean(data.humanTakeover));
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [conversationId, widgetKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !conversationId || sending) return;

    const content = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    const res = await fetch("/api/widget/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetKey, conversationId, content }),
    });
    setSending(false);

    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error || "Unable to send message.");
      return;
    }

    const data = await res.json();
    setMessages((prev) => {
      const next = [...prev];
      if (data.customerMessage) next.push(data.customerMessage);
      if (data.assistantMessage) next.push(data.assistantMessage);
      return next;
    });
    if (data.humanHandling) setHumanHandling(true);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#11100E] text-[#B5AEA2]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#11100E] p-6 text-center">
        <AlertCircle className="h-8 w-8 text-rose-400" />
        <p className="mt-3 text-sm text-[#D6D0C4]">{error || "Chat widget unavailable."}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#11100E] text-[#F5F2EB]">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 text-white"
        style={{ backgroundColor: config.primaryColor || "#D97745" }}
      >
        <div className="flex items-center gap-2.5">
          {humanHandling ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <UserCheck className="h-4 w-4" />
            </div>
          ) : (
            <EmberFox mood={sending ? "thinking" : "friendly"} size={36} />
          )}
          <div>
            <p className="text-sm font-semibold leading-tight">{config.assistantName}</p>
            <p className="text-[11px] opacity-90">
              {humanHandling ? `${config.businessName} Team` : config.businessName}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[10px] font-medium">
          {humanHandling ? "Human Support" : "Online"}
        </span>
      </div>

      {/* Consent Gate (if configured by business) */}
      {!consentChoiceMade ? (
        <div className="flex flex-1 flex-col justify-center p-6">
          <div className="rounded-xl border border-[#2B2722] bg-[#181613] p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#D97745]/15 text-[#D97745]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold text-white">Chat Privacy Preference</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#B5AEA2]">
              Would you like to save your conversation in this browser so you can continue it
              later, or chat for this session only?
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button size="sm" onClick={() => startSession(true)}>
                Remember My Chat
              </Button>
              <Button size="sm" variant="secondary" onClick={() => startSession(false)}>
                Continue Without Saving
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender_type === "customer"
                    ? "items-end"
                    : m.sender_type === "system"
                      ? "items-center"
                      : "items-start"
                }`}
              >
                {m.sender_type === "system" ? (
                  <span className="rounded-full border border-[#2B2722] bg-[#181613] px-3 py-1 text-[11px] text-[#B5AEA2]">
                    {m.content}
                  </span>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.sender_type === "customer"
                        ? "bg-[#D97745] text-white"
                        : "border border-[#2B2722] bg-[#211E1A] text-[#F5F2EB]"
                    }`}
                  >
                    {m.content}
                  </div>
                )}
              </div>
            ))}
            {sending ? (
              <div className="flex items-center gap-2 text-xs text-[#B5AEA2]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Typing...
              </div>
            ) : null}
            {error ? <p className="text-xs text-rose-400">{error}</p> : null}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-[#2B2722] bg-[#141210] p-3"
          >
            <Input
              placeholder="Write your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" size="icon" disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
