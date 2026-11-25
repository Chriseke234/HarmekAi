import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildTrialPerformanceReport, evaluateTrialStatus } from "@/lib/billing/trial";
import type { TrialRecord } from "@/types/database";

export async function GET(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(7, Number(searchParams.get("days") || 30)));
  const sinceIso = new Date(Date.now() - days * 86_400_000).toISOString();

  const supabase = await createSupabaseServerClient();
  const workspaceId = auth.context.workspace.id;

  const [convRes, msgRes, unansweredRes, usageRes, trialRes] = await Promise.all([
    supabase
      .from("conversations")
      .select(
        "id, status, human_takeover, lead_captured, sale_completed, verified_revenue_amount, first_response_ms, created_at"
      )
      .eq("workspace_id", workspaceId)
      .neq("channel", "simulator")
      .gte("created_at", sinceIso),
    supabase
      .from("messages")
      .select("id, sender_type, intelligence_mode, intent, created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", sinceIso),
    supabase
      .from("unanswered_questions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("usage_records")
      .select("metric_type, intelligence_mode, quantity, tokens_used, estimated_cost_usd, recorded_at")
      .eq("workspace_id", workspaceId)
      .gte("recorded_at", sinceIso),
    supabase
      .from("trial_records")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle<TrialRecord>(),
  ]);

  const conversations = convRes.data ?? [];
  const messages = msgRes.data ?? [];
  const unanswered = unansweredRes.data ?? [];
  const usage = usageRes.data ?? [];
  const trialSummary = evaluateTrialStatus(trialRes.data ?? null);

  const totalConversations = conversations.length;
  const aiHandledConversations = conversations.filter((c) => !c.human_takeover).length;
  const humanHandledConversations = conversations.filter((c) => c.human_takeover).length;
  const escalatedConversations = conversations.filter(
    (c) => c.status === "waiting_for_human" || c.human_takeover
  ).length;
  const resolvedConversations = conversations.filter((c) => c.status === "resolved").length;
  const leadsCaptured = conversations.filter((c) => c.lead_captured).length;
  const salesCompleted = conversations.filter((c) => c.sale_completed).length;
  const verifiedRevenueTotal = Number(
    conversations
      .filter((c) => c.sale_completed && typeof c.verified_revenue_amount === "number")
      .reduce((sum, c) => sum + Number(c.verified_revenue_amount ?? 0), 0)
      .toFixed(2)
  );

  const responseTimes = conversations
    .map((c) => c.first_response_ms)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgFirstResponseMs =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null;

  const nativeMessagesUsed = usage
    .filter((u) => u.intelligence_mode === "native")
    .reduce((sum, u) => sum + (u.quantity ?? 0), 0);
  const enhancedMessagesUsed = usage
    .filter((u) => u.intelligence_mode === "enhanced")
    .reduce((sum, u) => sum + (u.quantity ?? 0), 0);

  // Aggregate common intents from real recorded messages
  const intentCounts = new Map<string, number>();
  for (const m of messages) {
    if (m.intent && m.intent !== "greeting" && m.intent !== "unknown") {
      intentCounts.set(m.intent, (intentCounts.get(m.intent) ?? 0) + 1);
    }
  }
  const commonIntents = Array.from(intentCounts.entries())
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count);

  // Daily series for charts (real DB dates)
  const dailyMap = new Map<string, { date: string; ai: number; human: number }>();
  for (const c of conversations) {
    const day = (c.created_at as string).slice(0, 10);
    const entry = dailyMap.get(day) ?? { date: day, ai: 0, human: 0 };
    if (c.human_takeover) entry.human += 1;
    else entry.ai += 1;
    dailyMap.set(day, entry);
  }
  const dailySeries = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const trialReport = buildTrialPerformanceReport({
    totalConversations,
    aiHandledConversations,
    humanEscalations: escalatedConversations,
    resolvedConversations,
    leadsCaptured,
    unansweredQuestions: unanswered.map((u) => ({
      question: u.question as string,
      detected_intent: (u.detected_intent as string | null) ?? null,
    })),
    avgFirstResponseMs,
    nativeMessagesUsed,
    enhancedMessagesUsed,
    conversationLimit: trialSummary.conversationLimit,
    messageLimit: trialSummary.messageLimit,
    commonIntents,
  });

  return NextResponse.json({
    rangeDays: days,
    summary: {
      totalConversations,
      aiHandledConversations,
      humanHandledConversations,
      escalatedConversations,
      resolvedConversations,
      leadsCaptured,
      salesCompleted,
      verifiedRevenueTotal,
      unansweredCount: unanswered.filter((u) => u.status === "open").length,
      avgFirstResponseMs,
      nativeMessagesUsed,
      enhancedMessagesUsed,
    },
    dailySeries,
    unansweredQuestions: unanswered,
    trialStatus: trialSummary,
    trialReport,
  });
}
