"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Search,
  Send,
  StickyNote,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import type { Conversation, ConversationStatus, Message } from "@/types/database";

interface ConversationListItem extends Conversation {
  contacts?: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
}

interface InternalNote {
  id: string;
  content: string;
  created_at: string;
  profiles?: { full_name?: string; email?: string } | null;
}

export default function ConversationsPage() {
  const [list, setList] = useState<ConversationListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<ConversationListItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [sending, setSending] = useState(false);

  async function loadConversations() {
    setLoadingList(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/conversations?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setList(data.conversations ?? []);
      if (!selectedId && data.conversations?.length > 0) {
        setSelectedId(data.conversations[0].id);
      }
    }
    setLoadingList(false);
  }

  async function loadThread(id: string) {
    const res = await fetch(`/api/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedConv(data.conversation);
      setMessages(data.messages ?? []);
      setNotes(data.notes ?? []);
    }
  }

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (selectedId) loadThread(selectedId);
  }, [selectedId]);

  async function runAction(payload: Record<string, unknown>) {
    if (!selectedId) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSending(false);
    if (res.ok) {
      await loadThread(selectedId);
      await loadConversations();
    }
  }

  async function handleSendAgentReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    const text = replyText.trim();
    setReplyText("");
    await runAction({ action: "send_agent_message", content: text });
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    const text = noteText.trim();
    setNoteText("");
    await runAction({ action: "add_internal_note", content: text });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Conversations</h1>
          <p className="mt-1 text-sm text-[#B5AEA2]">
            Manage live chats, take over as a human agent, or return handling to Harmek AI.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#968E82]" />
            <Input
              className="w-52 pl-9"
              placeholder="Search inbox..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadConversations();
              }}
            />
          </div>
          <Select
            className="w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="ai_handling">AI Handling</option>
            <option value="waiting_for_human">Waiting for Human</option>
            <option value="assigned">Assigned</option>
            <option value="resolved">Resolved</option>
          </Select>
        </div>
      </div>

      {loadingList ? (
        <div className="flex h-64 items-center justify-center text-[#B5AEA2]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="No conversations yet"
          description="Once customers message your website chat widget, every conversation appears here in real time."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Conversation List */}
          <Card className="h-[640px] overflow-y-auto p-2 lg:col-span-4">
            <div className="space-y-1.5">
              {list.map((c) => {
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                      active
                        ? "border-[#D97745]/50 bg-[#D97745]/15"
                        : "border-transparent bg-[#141210] hover:border-[#2B2722]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {c.contacts?.full_name || c.contacts?.email || "Website Visitor"}
                      </span>
                      <span className="shrink-0 text-[11px] text-[#968E82]">
                        {formatRelativeTime(c.last_message_at)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[#B5AEA2]">
                      {c.summary || "New website conversation"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge
                        variant={
                          c.status === "waiting_for_human"
                            ? "warning"
                            : c.status === "resolved"
                              ? "success"
                              : "secondary"
                        }
                      >
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                      {c.unread_count > 0 ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D97745] px-1.5 text-[11px] font-semibold text-white">
                          {c.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Message Thread & Controls */}
          <Card className="flex h-[640px] flex-col lg:col-span-5">
            {selectedConv ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2B2722] p-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      {selectedConv.contacts?.full_name || "Website Visitor"}
                    </h2>
                    <p className="text-xs text-[#B5AEA2]">
                      {selectedConv.human_takeover
                        ? "Human takeover active — Harmek AI is paused"
                        : "Harmek AI is actively handling this conversation"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConv.human_takeover ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={sending}
                        onClick={() => runAction({ action: "return_to_ai" })}
                      >
                        <Bot className="h-3.5 w-3.5" />
                        Return to Harmek
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={sending}
                        onClick={() => runAction({ action: "take_over" })}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Take Over
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.sender_type === "customer"
                          ? "items-start"
                          : m.sender_type === "system"
                            ? "items-center"
                            : "items-end"
                      }`}
                    >
                      {m.sender_type === "system" ? (
                        <span className="rounded-full border border-[#2B2722] bg-[#141210] px-3 py-1 text-[11px] text-[#B5AEA2]">
                          {m.content}
                        </span>
                      ) : (
                        <div
                          className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                            m.sender_type === "customer"
                              ? "border border-[#2B2722] bg-[#211E1A] text-[#F5F2EB]"
                              : m.sender_type === "agent"
                                ? "bg-emerald-600/90 text-white"
                                : "bg-[#D97745] text-white"
                          }`}
                        >
                          <p className="mb-1 text-[10px] uppercase tracking-wider opacity-75">
                            {m.sender_type === "customer"
                              ? "Customer"
                              : m.sender_type === "agent"
                                ? "Human Agent"
                                : `Sage (${m.intelligence_mode || "native"})`}
                          </p>
                          <p>{m.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleSendAgentReply}
                  className="flex gap-2 border-t border-[#2B2722] p-3"
                >
                  <Input
                    placeholder="Reply as a human agent (automatically pauses AI)..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button type="submit" disabled={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : null}
          </Card>

          {/* Details & Internal Notes */}
          <Card className="h-[640px] space-y-4 overflow-y-auto p-4 lg:col-span-3">
            {selectedConv ? (
              <>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B5AEA2]">
                    Conversation Status
                  </h3>
                  <Select
                    className="mt-2"
                    value={selectedConv.status}
                    onChange={(e) =>
                      runAction({
                        action: "update_status",
                        status: e.target.value as ConversationStatus,
                      })
                    }
                  >
                    <option value="open">Open</option>
                    <option value="ai_handling">AI Handling</option>
                    <option value="waiting_for_human">Waiting for Human</option>
                    <option value="assigned">Assigned</option>
                    <option value="resolved">Resolved</option>
                  </Select>
                </div>

                <div className="space-y-1.5 border-t border-[#2B2722] pt-4 text-xs">
                  <h3 className="font-semibold uppercase tracking-wider text-[#B5AEA2]">
                    Customer Details
                  </h3>
                  <p className="text-[#F5F2EB]">
                    Name: {selectedConv.contacts?.full_name || "Not provided"}
                  </p>
                  <p className="text-[#D6D0C4]">
                    Email: {selectedConv.contacts?.email || "Not provided"}
                  </p>
                  <p className="text-[#D6D0C4]">
                    Phone: {selectedConv.contacts?.phone || "Not provided"}
                  </p>
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant={selectedConv.sale_completed ? "default" : "outline"}
                      className="w-full"
                      onClick={() =>
                        runAction({
                          action: "mark_sale_completed",
                          sale_completed: !selectedConv.sale_completed,
                        })
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {selectedConv.sale_completed ? "Sale Recorded" : "Mark Sale Completed"}
                    </Button>
                  </div>
                </div>

                {selectedConv.summary ? (
                  <div className="border-t border-[#2B2722] pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B5AEA2]">
                      Summary
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#D6D0C4]">
                      {selectedConv.summary}
                    </p>
                  </div>
                ) : null}

                <div className="border-t border-[#2B2722] pt-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#B5AEA2]">
                    <StickyNote className="h-3.5 w-3.5" />
                    Internal Notes
                  </h3>
                  <form onSubmit={handleAddNote} className="mt-2 flex gap-1.5">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Private staff note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <Button type="submit" size="sm" variant="secondary">
                      Add
                    </Button>
                  </form>
                  <div className="mt-3 space-y-2">
                    {notes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border border-[#2B2722] bg-[#141210] p-2.5 text-xs text-[#D6D0C4]"
                      >
                        <p>{n.content}</p>
                        <p className="mt-1 text-[10px] text-[#968E82]">
                          {formatRelativeTime(n.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  );
}
