"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileCode2,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { INITIAL_MESSAGES } from "@/lib/data";
import type { IntentMessage, IntentTag } from "@/lib/types";

const INTENT_STYLES: Record<IntentTag, string> = {
  hiring: "bg-[#e6f2ec] text-[#0f5132] border-[#0f5132]/20",
  collaboration: "bg-[#eff6ff] text-[#1d4ed8] border-[#1d4ed8]/20",
  advice: "bg-amber-50 text-amber-900 border-amber-200",
  general: "bg-[#f6f3ee] text-[#57534e] border-[#e5dfd6]",
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<IntentMessage[]>(INITIAL_MESSAGES);
  const [filterIntent, setFilterIntent] = useState<IntentTag | "all">("all");
  const [threadSearch, setThreadSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(INITIAL_MESSAGES[0]?.id ?? "");
  const [replyText, setReplyText] = useState("");
  const [sentReplies, setSentReplies] = useState<Record<string, string[]>>({});
  const [composeOpen, setComposeOpen] = useState(false);

  // New Intent Message Modal state
  const [newRecipient, setNewRecipient] = useState("");
  const [newIntent, setNewIntent] = useState<IntentTag>("collaboration");
  const [newBody, setNewBody] = useState("");

  const visibleMessages = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    return messages.filter((m) => {
      if (filterIntent !== "all" && m.intentTag !== filterIntent) return false;
      if (!q) return true;
      return (
        m.senderName.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (m.relatedJobTitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [messages, filterIntent, threadSearch]);

  const activeMessage =
    visibleMessages.find((m) => m.id === selectedId) ?? visibleMessages[0] ?? null;

  function handleSelectThread(id: string) {
    setSelectedId(id);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unread: false } : m)),
    );
  }

  function handleSendReply(e: FormEvent) {
    e.preventDefault();
    if (!activeMessage || !replyText.trim()) return;
    const text = replyText.trim();
    setSentReplies((prev) => ({
      ...prev,
      [activeMessage.id]: [...(prev[activeMessage.id] ?? []), text],
    }));
    setMessages((prev) =>
      prev.map((m) => (m.id === activeMessage.id ? { ...m, unread: false } : m)),
    );
    setReplyText("");
  }

  function handleAiDraftReply() {
    if (!activeMessage) return;
    const firstName = activeMessage.senderName.split(" ")[0];
    if (activeMessage.intentTag === "hiring") {
      setReplyText(
        `Hi ${firstName} — Thursday at 15:00 UTC works great. I'll come ready to walk through the pg-ledger-kit settlement guarantees and how they map to Northstar's Postgres roadmap.`,
      );
    } else if (activeMessage.intentTag === "collaboration") {
      setReplyText(
        `Hi ${firstName} — would love to review the connection-pooling benchmark draft. Send over the repo link whenever it's ready and I'll leave notes by Friday.`,
      );
    } else {
      setReplyText(
        `Hi ${firstName} — happy to share our CI pattern! We spin up an ephemeral Supabase branch and run pgTAP policy assertions per tenant role in under 18 seconds.`,
      );
    }
  }

  function handleCreateMessage(e: FormEvent) {
    e.preventDefault();
    if (!newRecipient.trim() || !newBody.trim()) return;
    const created: IntentMessage = {
      id: `msg-new-${Date.now()}`,
      senderName: newRecipient.trim(),
      senderHandle: newRecipient.trim().toLowerCase().replace(/\s+/g, "-"),
      senderAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      senderHeadline: "Meridian Member",
      online: true,
      intentTag: newIntent,
      body: `You started a ${newIntent} thread: "${newBody.trim()}"`,
      createdAt: "Just now",
      unread: false,
    };
    setMessages((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setNewRecipient("");
    setNewBody("");
    setComposeOpen(false);
  }

  return (
    <div className="mx-auto max-w-[1340px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#141413]">
            Intent-Tagged Inbox
          </h1>
          <p className="mt-0.5 text-xs text-[#57534e]">
            Zero InMail paywalls — every outreach declares its intent upfront so real conversations stand out.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0f5132] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a3b24] transition cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New Intent Message (Free)</span>
        </button>
      </div>

      {/* Split-Pane Executive Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-[#e5dfd6] bg-white overflow-hidden">
        {/* Left Thread List */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#e5dfd6] flex flex-col">
          <div className="p-3.5 border-b border-[#efeae2] space-y-2.5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#78716c]"
                aria-hidden="true"
              />
              <input
                type="text"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="Search threads or roles..."
                className="w-full rounded-full border border-[#e5dfd6] bg-[#f6f3ee] py-1.5 pl-8 pr-3 text-xs focus:border-[#0f5132] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {(["all", "hiring", "collaboration", "advice"] as const).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFilterIntent(tag)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition cursor-pointer ${
                    filterIntent === tag
                      ? "bg-[#141413] text-white"
                      : "bg-[#f6f3ee] text-[#57534e] hover:text-[#141413]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#f0ebe3] max-h-[520px] overflow-y-auto">
            {visibleMessages.map((msg) => {
              const isSelected = activeMessage?.id === msg.id;
              return (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => handleSelectThread(msg.id)}
                  className={`w-full text-left p-4 transition cursor-pointer ${
                    isSelected ? "bg-[#f6f3ee]" : "hover:bg-[#faf8f5]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <Image
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover border border-[#e5dfd6]"
                      />
                      {msg.online && (
                        <span
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#0f5132] ring-2 ring-white"
                          aria-label="Online"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#141413] truncate">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-[#78716c] shrink-0">
                          {msg.createdAt}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${INTENT_STYLES[msg.intentTag]}`}
                        >
                          {msg.intentTag}
                        </span>
                        {msg.unread && (
                          <span className="h-2 w-2 rounded-full bg-[#0f5132]" />
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-[#57534e] line-clamp-2 leading-snug">
                        {msg.body}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Conversation */}
        <div className="lg:col-span-8 flex flex-col justify-between p-5 sm:p-6 min-h-[520px]">
          {activeMessage ? (
            <>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efeae2] pb-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={activeMessage.senderAvatar}
                      alt={activeMessage.senderName}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover border border-[#e5dfd6]"
                    />
                    <div>
                      <Link
                        href={`/u/${activeMessage.senderHandle}`}
                        className="text-sm font-bold text-[#141413] hover:text-[#0f5132] hover:underline"
                      >
                        {activeMessage.senderName}
                      </Link>
                      <p className="text-xs text-[#57534e]">{activeMessage.senderHeadline}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${INTENT_STYLES[activeMessage.intentTag]}`}
                  >
                    Intent: {activeMessage.intentTag}
                  </span>
                </div>

                {/* Context Banner */}
                {(activeMessage.relatedJobTitle || activeMessage.attachedArtifact) && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#e5dfd6] bg-[#f6f3ee] px-4 py-2.5 text-xs text-[#292524]">
                    {activeMessage.relatedJobTitle && (
                      <span>
                        Role:{" "}
                        <strong className="font-semibold text-[#141413]">
                          {activeMessage.relatedJobTitle}
                        </strong>
                      </span>
                    )}
                    {activeMessage.attachedArtifact && (
                      <span className="inline-flex items-center gap-1 text-[#0f5132] font-semibold">
                        <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {activeMessage.attachedArtifact}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubbles */}
                <div className="mt-5 space-y-3">
                  <div className="max-w-xl rounded-2xl rounded-tl-sm bg-[#f6f3ee] p-4 text-sm text-[#141413] leading-relaxed">
                    {activeMessage.body}
                  </div>

                  {(sentReplies[activeMessage.id] ?? []).map((reply, idx) => (
                    <div
                      key={`${activeMessage.id}-reply-${idx}`}
                      className="ml-auto max-w-xl rounded-2xl rounded-tr-sm bg-[#0f5132] p-4 text-sm text-white leading-relaxed"
                    >
                      {reply}
                    </div>
                  ))}
                </div>
              </div>

              {/* Composer with AI Draft Reply */}
              <form onSubmit={handleSendReply} className="mt-6 pt-4 border-t border-[#efeae2] space-y-2.5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAiDraftReply}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e5dfd6] bg-[#f6f3ee] px-3 py-1 text-[11px] font-semibold text-[#0f5132] hover:border-[#0f5132] transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>AI Draft Context Reply</span>
                  </button>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#78716c]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#0f5132]" aria-hidden="true" />
                    Supabase Realtime + RLS
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${activeMessage.senderName}...`}
                    className="flex-1 rounded-full border border-[#e5dfd6] bg-[#f6f3ee] px-4 py-2.5 text-xs focus:border-[#0f5132] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#141413] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f5132] transition cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[#78716c]">
              Select a conversation to view messages.
            </div>
          )}
        </div>
      </div>

      {/* New Free Intent Message Modal */}
      {composeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/55 p-4 backdrop-blur-xs"
        >
          <form
            onSubmit={handleCreateMessage}
            className="w-full max-w-md rounded-2xl border border-[#e5dfd6] bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-[#141413]">
                New Intent Message
              </h2>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-[#78716c] hover:bg-[#f6f3ee] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141413]">Recipient Name</label>
              <input
                type="text"
                required
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="e.g., Maya Lin"
                className="mt-1 w-full rounded-xl border border-[#e5dfd6] bg-[#f6f3ee] px-3 py-2 text-xs focus:border-[#0f5132] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141413]">Intent Tag</label>
              <select
                value={newIntent}
                onChange={(e) => setNewIntent(e.target.value as IntentTag)}
                className="mt-1 w-full rounded-xl border border-[#e5dfd6] bg-[#f6f3ee] px-3 py-2 text-xs focus:border-[#0f5132] focus:bg-white focus:outline-none"
              >
                <option value="hiring">Hiring</option>
                <option value="collaboration">Collaboration</option>
                <option value="advice">Advice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141413]">Message</label>
              <textarea
                rows={3}
                required
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Lead with context — no character paywall..."
                className="mt-1 w-full rounded-xl border border-[#e5dfd6] bg-[#f6f3ee] p-3 text-xs focus:border-[#0f5132] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-full px-4 py-2 text-xs font-semibold text-[#57534e] hover:bg-[#f6f3ee] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#0f5132] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0a3b24] cursor-pointer"
              >
                Send Free Intro
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
