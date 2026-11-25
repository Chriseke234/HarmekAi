"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  CheckCircle2,
  FileCode2,
  Flag,
  Lightbulb,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Rocket,
  Send,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import {
  INITIAL_POSTS,
  JOBS,
  ORGANISATIONS,
  PROFILES,
  formatSalaryRange,
} from "@/lib/data";
import { computeJobFit } from "@/lib/ai";
import type { FeedPost, PostCategory } from "@/lib/types";

interface CopilotTurn {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTED_PEERS = [
  {
    handle: "daniel-keller",
    name: "Daniel Keller",
    role: "Principal Designer · Northstar Labs",
    avatar: PROFILES[1].avatarUrl,
    reason: "Shared interest in design systems & transparent hiring",
  },
  {
    handle: "elena-vance",
    name: "Elena Vance",
    role: "Eng Manager · Verve Health",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80",
    reason: "Hiring AI Systems Engineer ($150k–$185k)",
  },
];

export function SignalFeedHome() {
  const activeUser = PROFILES[0];
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_POSTS);
  const [lens, setLens] = useState<"all" | PostCategory>("all");

  // Composer state
  const [composerCategory, setComposerCategory] = useState<PostCategory>("shipped");
  const [composerTitle, setComposerTitle] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [composerNotice, setComposerNotice] = useState<string | null>(null);

  // Interactive engagement state
  const [reactedPosts, setReactedPosts] = useState<Record<string, "insightful" | "shipped">>({});
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [openCommentsId, setOpenCommentsId] = useState<string | null>("post-1");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [connectedHandles, setConnectedHandles] = useState<string[]>([]);

  // Interactive AI Career Copilot state
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotHistory, setCopilotHistory] = useState<CopilotTurn[]>([
    {
      role: "assistant",
      text: `Hi ${activeUser.fullName.split(" ")[0]}. I analyzed your 3 verified Proof-of-Work artifacts against 6 active verified roles. Your strongest match is Staff Full-Stack Engineer at Northstar Labs (100% fit, $165k–$205k, 24h reply SLA). Ask me anything or pick a quick action below.`,
    },
  ]);

  const filteredPosts = useMemo(() => {
    if (lens === "all") return posts;
    return posts.filter((p) => p.category === lens);
  }, [posts, lens]);

  function handleRefineWithAI() {
    if (!composerBody.trim()) {
      setComposerBody(
        "Shipped a zero-downtime Postgres migration cutting p95 query latency from 140ms to 34ms using partial indexes and RLS-safe views. Happy to share the benchmark SQL.",
      );
      setComposerTitle("Cutting p95 Postgres latency by 75% without leaving SQL");
      setComposerNotice("Drafted from your recent shipped artifacts — edit to match your voice.");
      return;
    }
    setComposerBody((prev) => prev.replace(/\s+/g, " ").trim());
    setComposerNotice("Tightened phrasing for clarity and zero filler.");
  }

  function handlePublishPost(e: FormEvent) {
    e.preventDefault();
    if (!composerBody.trim()) return;

    const newPost: FeedPost = {
      id: `post-local-${Date.now()}`,
      authorName: activeUser.fullName,
      authorHandle: activeUser.handle,
      authorAvatar: activeUser.avatarUrl,
      authorHeadline: activeUser.headline,
      authorVerified: true,
      category: composerCategory,
      createdAt: "Just now",
      title: composerTitle.trim() || undefined,
      body: composerBody.trim(),
      tags: [composerCategory === "shipped" ? "ProofOfWork" : "Engineering"],
      reactions: { insightful: 1, shipped: 0, support: 0 },
      comments: [],
      reposts: 0,
    };

    setPosts((prev) => [newPost, ...prev]);
    setComposerTitle("");
    setComposerBody("");
    setComposerNotice(null);
  }

  function toggleReaction(postId: string, kind: "insightful" | "shipped") {
    const current = reactedPosts[postId];
    setReactedPosts((prev) => {
      const copy = { ...prev };
      if (current === kind) delete copy[postId];
      else copy[postId] = kind;
      return copy;
    });

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextReactions = { ...post.reactions };
        if (current) nextReactions[current] = Math.max(0, nextReactions[current] - 1);
        if (current !== kind) nextReactions[kind] += 1;
        return { ...post, reactions: nextReactions };
      }),
    );
  }

  function handleAddComment(postId: string, e: FormEvent) {
    e.preventDefault();
    const text = (commentDrafts[postId] ?? "").trim();
    if (!text) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `c-${Date.now()}`,
                  authorName: activeUser.fullName,
                  authorHandle: activeUser.handle,
                  authorAvatar: activeUser.avatarUrl,
                  authorRole: "Staff Engineer · Kestrel Financial",
                  body: text,
                  createdAt: "Just now",
                },
              ],
            }
          : p,
      ),
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
  }

  function flagAsSlop(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setOpenMenuId(null);
  }

  function runCopilotPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    let reply = "";

    if (lower.includes("role") || lower.includes("job") || lower.includes("remote")) {
      const ranked = JOBS.map((job) => ({ job, fit: computeJobFit(activeUser, job) }))
        .sort((a, b) => b.fit.matchScore - a.fit.matchScore)
        .slice(0, 2);
      reply = ranked
        .map(
          ({ job, fit }) =>
            `• ${job.title} at ${job.org.name} (${fit.matchScore}% fit · ${formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)} · ${job.org.responseRatePct}% reply rate)`,
        )
        .join("\n");
    } else if (lower.includes("audit") || lower.includes("gap") || lower.includes("profile")) {
      reply =
        "Your Postgres, TypeScript, and Next.js proof artifacts are strong (3/3 verified). To unlock AI Systems & Staff Backend roles above $185k, add one Python or Go benchmark artifact to your Proof-of-Work shelf.";
    } else if (lower.includes("intro") || lower.includes("daniel")) {
      reply =
        'Draft intro (Hiring intent): "Hi Daniel — loved your write-up on replacing 1-click resumes at Northstar Labs. I attached pg-ledger-kit and my 38ms pgvector benchmark to my Staff Full-Stack application and would enjoy walking through the architecture."';
    } else {
      reply =
        "Based on your verified profile (Staff Full-Stack · Next.js, PostgreSQL, Supabase), I recommend leading with your pg-ledger-kit and VectorJobs artifacts when applying to Northstar Labs or Solstice Grid.";
    }

    setCopilotHistory((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ]);
    setCopilotInput("");
  }

  return (
    <div className="mx-auto max-w-[1340px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT RAIL: Proof-of-Work Identity & Warm Network */}
        <aside className="lg:col-span-3 space-y-5">
          {/* Identity Dossier Mini-Card */}
          <div className="overflow-hidden rounded-2xl border border-[#e5dfd6] bg-white">
            <div className="relative h-20 w-full bg-[#141413]">
              <Image
                src={activeUser.coverUrl}
                alt="Profile banner"
                fill
                className="object-cover opacity-80"
              />
            </div>
            <div className="px-5 pb-5">
              <div className="-mt-8 mb-3 flex items-end justify-between">
                <Image
                  src={activeUser.avatarUrl}
                  alt={activeUser.fullName}
                  width={60}
                  height={60}
                  className="h-15 w-15 rounded-xl border-3 border-white object-cover shadow-sm bg-white"
                />
                <span className="rounded-full bg-[#e6f2ec] px-2.5 py-0.5 text-[11px] font-semibold text-[#0f5132]">
                  Open to Roles
                </span>
              </div>

              <Link
                href={`/u/${activeUser.handle}`}
                className="font-display text-xl font-semibold text-[#141413] hover:text-[#0f5132] transition block"
              >
                {activeUser.fullName}
              </Link>
              <p className="mt-1 text-xs text-[#57534e] leading-relaxed">
                {activeUser.headline}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#efeae2] pt-3.5 text-xs">
                <div>
                  <span className="text-[#78716c] block text-[11px]">Verified Proof</span>
                  <span className="font-mono-num font-bold text-[#141413]">
                    {activeUser.artifacts.length} artifacts
                  </span>
                </div>
                <div>
                  <span className="text-[#78716c] block text-[11px]">Profile Views</span>
                  <span className="font-mono-num font-bold text-[#0f5132]">
                    {activeUser.profileViews30d} (30d)
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-1.5 border-t border-[#efeae2] pt-3.5 text-xs">
                <Link
                  href={`/u/${activeUser.handle}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 font-medium text-[#141413] hover:bg-[#f6f3ee]"
                >
                  <span>Edit Proof-of-Work Dossier</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#78716c]" aria-hidden="true" />
                </Link>
                <Link
                  href="/jobs"
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 font-medium text-[#141413] hover:bg-[#f6f3ee]"
                >
                  <span>Saved &amp; Matched Roles</span>
                  <span className="font-mono-num text-[11px] font-semibold text-[#0f5132]">
                    {JOBS.length} live
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Warm Intros / Network Expansion */}
          <div className="rounded-2xl border border-[#e5dfd6] bg-white p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-bold text-[#141413] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0f5132]" aria-hidden="true" />
                <span>Warm Introductions</span>
              </h2>
              <span className="text-[11px] text-[#78716c]">Free notes</span>
            </div>

            <div className="space-y-4">
              {SUGGESTED_PEERS.map((peer) => {
                const connected = connectedHandles.includes(peer.handle);
                return (
                  <div key={peer.handle} className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <Image
                        src={peer.avatar}
                        alt={peer.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover border border-[#e5dfd6] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#141413] truncate">
                          {peer.name}
                        </p>
                        <p className="text-[11px] text-[#57534e] truncate">{peer.role}</p>
                        <p className="mt-1 text-[11px] text-[#78716c] leading-snug">
                          {peer.reason}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConnectedHandles((prev) =>
                          prev.includes(peer.handle)
                            ? prev.filter((h) => h !== peer.handle)
                            : [...prev, peer.handle],
                        )
                      }
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition cursor-pointer ${
                        connected
                          ? "bg-[#e6f2ec] text-[#0f5132]"
                          : "border border-[#d6cec2] text-[#141413] hover:border-[#141413]"
                      }`}
                    >
                      {connected ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Intro Sent</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Connect with Context</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: Multi-Format Composer + Curated Signal Feed */}
        <section className="lg:col-span-6 space-y-5">
          {/* Editorial Signal Header & Lens Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[#141413]">
                Signal Feed
              </h1>
              <p className="text-xs text-[#57534e] mt-0.5">
                Shipped work, engineering notes, and transparent roles — zero engagement bait.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all", label: "All Signal" },
                  { id: "shipped", label: "Shipped Work" },
                  { id: "engineering", label: "Engineering" },
                  { id: "hiring", label: "Hiring" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLens(tab.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    lens === tab.id
                      ? "bg-[#141413] text-white"
                      : "bg-white border border-[#e5dfd6] text-[#57534e] hover:border-[#141413] hover:text-[#141413]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rich Post Composer */}
          <form
            onSubmit={handlePublishPost}
            className="rounded-2xl border border-[#e5dfd6] bg-white p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Image
                  src={activeUser.avatarUrl}
                  alt={activeUser.fullName}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: "shipped", label: "Shipped Work" },
                      { id: "engineering", label: "Engineering Note" },
                      { id: "hiring", label: "Transparent Role" },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setComposerCategory(mode.id)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                        composerCategory === mode.id
                          ? "bg-[#e6f2ec] text-[#0f5132]"
                          : "text-[#78716c] hover:bg-[#f6f3ee]"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <input
              type="text"
              value={composerTitle}
              onChange={(e) => setComposerTitle(e.target.value)}
              placeholder="Optional headline (e.g., How we cut Postgres p95 latency by 62%)"
              className="w-full border-b border-[#efeae2] pb-2 text-sm font-semibold text-[#141413] placeholder:text-[#a8a29e] focus:border-[#0f5132] focus:outline-none"
            />

            <textarea
              rows={3}
              value={composerBody}
              onChange={(e) => setComposerBody(e.target.value)}
              placeholder="Share a concrete system trade-off, shipped benchmark, or open role with salary..."
              className="w-full resize-none text-sm text-[#141413] placeholder:text-[#a8a29e] focus:outline-none leading-relaxed"
            />

            {composerNotice && (
              <p className="text-[11px] font-medium text-[#0f5132]">{composerNotice}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#efeae2] pt-3">
              <button
                type="button"
                onClick={handleRefineWithAI}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e5dfd6] px-3 py-1.5 text-xs font-semibold text-[#57534e] hover:border-[#0f5132] hover:text-[#0f5132] transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>AI Tighten (Zero Slop)</span>
              </button>

              <button
                type="submit"
                disabled={!composerBody.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0f5132] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0a3b24] disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Publish Signal</span>
              </button>
            </div>
          </form>

          {/* Feed Stream */}
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const myReaction = reactedPosts[post.id];
              const isSaved = savedPostIds.includes(post.id);
              const commentsOpen = openCommentsId === post.id;
              const linkedJob = post.linkedJobId
                ? JOBS.find((j) => j.id === post.linkedJobId)
                : null;

              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-[#e5dfd6] bg-white p-5 sm:p-6 space-y-4"
                >
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Image
                        src={post.authorAvatar}
                        alt={post.authorName}
                        width={42}
                        height={42}
                        className="h-10.5 w-10.5 rounded-full object-cover border border-[#e5dfd6] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/u/${post.authorHandle}`}
                            className="text-sm font-bold text-[#141413] hover:text-[#0f5132] truncate"
                          >
                            {post.authorName}
                          </Link>
                          {post.authorVerified && (
                            <BadgeCheck
                              className="h-4 w-4 text-[#0f5132] shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span className="text-xs text-[#78716c]">· {post.createdAt}</span>
                        </div>
                        <p className="text-xs text-[#57534e] truncate">
                          {post.authorHeadline}
                        </p>
                      </div>
                    </div>

                    {/* Overflow Menu (includes Flag AI Slop) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId((cur) => (cur === post.id ? null : post.id))
                        }
                        aria-label="Post options"
                        className="rounded-lg p-1.5 text-[#78716c] hover:bg-[#f6f3ee] hover:text-[#141413] cursor-pointer"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {openMenuId === post.id && (
                        <div className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-[#e5dfd6] bg-white p-1.5 shadow-lg text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSavedPostIds((prev) =>
                                prev.includes(post.id) ? prev : [...prev, post.id],
                              );
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[#141413] hover:bg-[#f6f3ee] cursor-pointer"
                          >
                            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Save to Bookmarks</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => flagAsSlop(post.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-amber-800 hover:bg-amber-50 cursor-pointer"
                          >
                            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Flag as AI Slop &amp; Hide</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editorial Post Content */}
                  <div className="space-y-2.5">
                    {post.title && (
                      <h2 className="font-display text-xl font-semibold text-[#141413] leading-snug">
                        {post.title}
                      </h2>
                    )}
                    <p className="text-sm text-[#292524] leading-relaxed max-w-[68ch]">
                      {post.body}
                    </p>
                  </div>

                  {/* Optional Media */}
                  {post.imageUrl && (
                    <div className="relative h-60 sm:h-72 w-full overflow-hidden rounded-xl border border-[#e5dfd6]">
                      <Image
                        src={post.imageUrl}
                        alt={post.title ?? "Post attachment"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Linked Proof Artifact Strip */}
                  {post.linkedArtifact && (
                    <a
                      href={post.linkedArtifact.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#e5dfd6] bg-[#f6f3ee] p-3.5 hover:border-[#0f5132] transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-[#e5dfd6] text-[#0f5132] shrink-0">
                          <FileCode2 className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#141413] truncate">
                            {post.linkedArtifact.title}
                          </p>
                          <p className="text-[11px] text-[#57534e]">
                            {post.linkedArtifact.source} ·{" "}
                            <span className="font-mono-num">{post.linkedArtifact.metrics}</span>
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#0f5132] shrink-0" aria-hidden="true" />
                    </a>
                  )}

                  {/* Linked Transparent Job Strip */}
                  {linkedJob && (
                    <Link
                      href={`/jobs?selected=${linkedJob.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[#e5dfd6] bg-[#e6f2ec]/40 p-3.5 hover:border-[#0f5132] transition"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#141413]">{linkedJob.title}</p>
                        <p className="text-[11px] text-[#57534e]">
                          {linkedJob.org.name} ·{" "}
                          <span className="font-mono-num font-semibold text-[#0f5132]">
                            {formatSalaryRange(
                              linkedJob.salaryMin,
                              linkedJob.salaryMax,
                              linkedJob.salaryCurrency,
                            )}
                          </span>{" "}
                          · {linkedJob.org.responseRatePct}% reply rate
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f5132] shrink-0">
                        <span>Check Fit</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </Link>
                  )}

                  {/* Engagement Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#efeae2] pt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleReaction(post.id, "insightful")}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition cursor-pointer ${
                          myReaction === "insightful"
                            ? "bg-[#141413] text-white"
                            : "text-[#57534e] hover:bg-[#f6f3ee]"
                        }`}
                      >
                        <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Insightful</span>
                        <span className="font-mono-num">{post.reactions.insightful}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleReaction(post.id, "shipped")}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition cursor-pointer ${
                          myReaction === "shipped"
                            ? "bg-[#0f5132] text-white"
                            : "text-[#57534e] hover:bg-[#f6f3ee]"
                        }`}
                      >
                        <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Shipped</span>
                        <span className="font-mono-num">{post.reactions.shipped}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenCommentsId((cur) => (cur === post.id ? null : post.id))
                        }
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-[#57534e] hover:bg-[#f6f3ee] transition cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="font-mono-num">{post.comments.length}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-[#78716c]">
                      <span className="inline-flex items-center gap-1 px-2 text-[11px] font-mono-num">
                        <Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {post.reposts}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSavedPostIds((prev) =>
                            prev.includes(post.id)
                              ? prev.filter((id) => id !== post.id)
                              : [...prev, post.id],
                          )
                        }
                        aria-label="Bookmark post"
                        className={`rounded-full p-1.5 transition cursor-pointer ${
                          isSaved ? "text-[#0f5132] bg-[#e6f2ec]" : "hover:bg-[#f6f3ee]"
                        }`}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Threaded Comments */}
                  {commentsOpen && (
                    <div className="space-y-3 border-t border-[#efeae2] pt-3.5">
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-2.5 text-xs">
                          <Image
                            src={c.authorAvatar}
                            alt={c.authorName}
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="flex-1 rounded-xl bg-[#f6f3ee] px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#141413]">{c.authorName}</span>
                              <span className="text-[10px] text-[#78716c]">{c.createdAt}</span>
                            </div>
                            <p className="text-[11px] text-[#78716c]">{c.authorRole}</p>
                            <p className="mt-1 text-xs text-[#292524] leading-relaxed">{c.body}</p>
                          </div>
                        </div>
                      ))}

                      <form
                        onSubmit={(e) => handleAddComment(post.id, e)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          placeholder="Add a substantive technical reply..."
                          className="flex-1 rounded-full border border-[#e5dfd6] bg-[#f6f3ee] px-3.5 py-2 text-xs focus:border-[#0f5132] focus:bg-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-[#141413] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0f5132] transition cursor-pointer"
                        >
                          Reply
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* RIGHT RAIL: Integrated AI Career Copilot + High-Signal Roles */}
        <aside className="lg:col-span-3 space-y-5 lg:sticky lg:top-22">
          {/* AI Career Copilot */}
          <div className="rounded-2xl border border-[#d6cec2] bg-white p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#141413] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0f5132]" aria-hidden="true" />
                <span>AI Career Copilot</span>
              </h2>
              <span className="rounded-full bg-[#e6f2ec] px-2 py-0.5 text-[10px] font-bold text-[#0f5132]">
                Free
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {copilotHistory.map((turn, idx) => (
                <div
                  key={`turn-${idx}`}
                  className={`rounded-xl p-3 leading-relaxed whitespace-pre-line ${
                    turn.role === "assistant"
                      ? "bg-[#f6f3ee] text-[#141413]"
                      : "bg-[#0f5132] text-white ml-4"
                  }`}
                >
                  {turn.text}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                "Highest-fit remote roles",
                "Audit my profile gaps",
                "Draft intro to Daniel",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => runCopilotPrompt(chip)}
                  className="rounded-full border border-[#e5dfd6] bg-[#f6f3ee] px-2.5 py-1 text-[11px] font-medium text-[#57534e] hover:border-[#0f5132] hover:text-[#0f5132] transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                runCopilotPrompt(copilotInput);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask about roles, skills, intros..."
                className="flex-1 rounded-full border border-[#e5dfd6] bg-[#f6f3ee] px-3 py-1.5 text-xs focus:border-[#0f5132] focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Send to AI Copilot"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#141413] text-white hover:bg-[#0f5132] transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* High-Signal Open Roles */}
          <div className="rounded-2xl border border-[#e5dfd6] bg-white p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#141413] flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#0f5132]" aria-hidden="true" />
                <span>Verified Roles</span>
              </h2>
              <Link
                href="/jobs"
                className="text-xs font-semibold text-[#0f5132] hover:underline"
              >
                All {JOBS.length}
              </Link>
            </div>

            <div className="space-y-3">
              {JOBS.slice(0, 3).map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs?selected=${job.id}`}
                  className="block rounded-xl border border-[#efeae2] p-3 hover:border-[#0f5132] hover:bg-[#f6f3ee]/50 transition"
                >
                  <p className="text-xs font-bold text-[#141413] leading-snug">
                    {job.title}
                  </p>
                  <p className="text-[11px] text-[#57534e] mt-0.5">
                    {job.org.name} · {job.org.responseRatePct}% reply
                  </p>
                  <p className="font-mono-num text-[11px] font-semibold text-[#0f5132] mt-1.5">
                    {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  </p>
                </Link>
              ))}
            </div>

            <div className="border-t border-[#efeae2] pt-3">
              <p className="text-[11px] font-semibold text-[#78716c] mb-2">
                Open Verified Hubs
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ORGANISATIONS.map((org) => (
                  <Link
                    key={org.id}
                    href={`/org/${org.slug}`}
                    className="rounded-full border border-[#e5dfd6] px-2.5 py-1 text-[11px] font-medium text-[#141413] hover:border-[#0f5132] hover:text-[#0f5132]"
                  >
                    {org.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
