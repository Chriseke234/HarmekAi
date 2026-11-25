import type { TrialRecord } from "@/types/database";

export interface TrialSummary {
  status: TrialRecord["status"];
  isActivated: boolean;
  isExpired: boolean;
  daysRemaining: number;
  activatedAt: string | null;
  expiresAt: string | null;
  conversationLimit: number;
  messageLimit: number;
  expiringSoon: boolean;
}

/**
 * Computes activation-based 14-day trial status deterministically.
 * Important: Trial starts ONLY when the assistant is activated (activated_at is set),
 * never simply at user registration.
 */
export function evaluateTrialStatus(
  trial: Pick<
    TrialRecord,
    "status" | "duration_days" | "activated_at" | "expires_at" | "conversation_limit" | "message_limit"
  > | null,
  now = new Date()
): TrialSummary {
  if (!trial || !trial.activated_at || trial.status === "not_started") {
    return {
      status: "not_started",
      isActivated: false,
      isExpired: false,
      daysRemaining: trial?.duration_days ?? 14,
      activatedAt: null,
      expiresAt: null,
      conversationLimit: trial?.conversation_limit ?? 500,
      messageLimit: trial?.message_limit ?? 2500,
      expiringSoon: false,
    };
  }

  if (trial.status === "converted") {
    return {
      status: "converted",
      isActivated: true,
      isExpired: false,
      daysRemaining: 0,
      activatedAt: trial.activated_at,
      expiresAt: trial.expires_at,
      conversationLimit: trial.conversation_limit,
      messageLimit: trial.message_limit,
      expiringSoon: false,
    };
  }

  const expiresDate = trial.expires_at
    ? new Date(trial.expires_at)
    : new Date(new Date(trial.activated_at).getTime() + trial.duration_days * 86_400_000);

  const msRemaining = expiresDate.getTime() - now.getTime();
  const isExpired = msRemaining <= 0 || trial.status === "expired";
  const daysRemaining = isExpired ? 0 : Math.ceil(msRemaining / 86_400_000);

  return {
    status: isExpired ? "expired" : "active",
    isActivated: true,
    isExpired,
    daysRemaining,
    activatedAt: trial.activated_at,
    expiresAt: expiresDate.toISOString(),
    conversationLimit: trial.conversation_limit,
    messageLimit: trial.message_limit,
    expiringSoon: !isExpired && daysRemaining <= 3,
  };
}

/**
 * Generates activation timestamps for starting a fresh 14-day trial.
 */
export function createTrialActivationWindow(durationDays = 14, now = new Date()) {
  const expires = new Date(now.getTime() + durationDays * 86_400_000);
  return {
    status: "active" as const,
    activated_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
}

export interface TrialReportInput {
  totalConversations: number;
  aiHandledConversations: number;
  humanEscalations: number;
  resolvedConversations: number;
  leadsCaptured: number;
  unansweredQuestions: Array<{ question: string; detected_intent: string | null }>;
  avgFirstResponseMs: number | null;
  nativeMessagesUsed: number;
  enhancedMessagesUsed: number;
  conversationLimit: number;
  messageLimit: number;
  commonIntents: Array<{ intent: string; count: number }>;
}

export interface TrialPerformanceReport {
  hasSufficientData: boolean;
  insufficientDataMessage: string | null;
  metrics: {
    totalConversations: number;
    aiHandledConversations: number;
    humanEscalations: number;
    resolvedConversations: number;
    unansweredQuestionsCount: number;
    leadsCaptured: number;
    avgResponseTimeSeconds: number | null;
    nativeMessagesUsed: number;
    enhancedMessagesUsed: number;
    remainingConversations: number;
    remainingMessages: number;
  };
  commonEnquiries: Array<{ topic: string; count: number }>;
  knowledgeGaps: string[];
  suggestions: string[];
}

/**
 * Compiles a genuine Trial Performance Report strictly from real recorded metrics.
 * Never fabricates results; clearly explains when there is insufficient data.
 */
export function buildTrialPerformanceReport(input: TrialReportInput): TrialPerformanceReport {
  const totalMessages = input.nativeMessagesUsed + input.enhancedMessagesUsed;
  const hasSufficientData = input.totalConversations > 0 || totalMessages > 0;

  const suggestions: string[] = [];
  if (!hasSufficientData) {
    suggestions.push(
      "Install the website chat widget or run test conversations so Harmek can record real customer interactions."
    );
  } else {
    if (input.unansweredQuestions.length > 0) {
      suggestions.push(
        `Add answers for ${input.unansweredQuestions.length} unanswered customer question${
          input.unansweredQuestions.length === 1 ? "" : "s"
        } to your Knowledge Base to improve automated resolution.`
      );
    }
    if (input.humanEscalations > 0 && input.totalConversations > 0) {
      const escalationRate = Math.round(
        (input.humanEscalations / input.totalConversations) * 100
      );
      if (escalationRate >= 30) {
        suggestions.push(
          `${escalationRate}% of conversations escalated to human staff. Review escalated threads and add missing policies, prices, or FAQs.`
        );
      }
    }
    if (input.leadsCaptured === 0 && input.totalConversations >= 3) {
      suggestions.push(
        "Enable the 'Capture Lead Information' automation so Harmek collects customer emails or phone numbers during enquiries."
      );
    }
    if (suggestions.length === 0) {
      suggestions.push(
        "Your Knowledge Base is covering current customer questions cleanly. Continue reviewing weekly analytics as traffic grows."
      );
    }
  }

  return {
    hasSufficientData,
    insufficientDataMessage: hasSufficientData
      ? null
      : "There is not enough recorded customer conversation data yet to evaluate performance trends. Once customers interact with your assistant, real metrics will appear here automatically.",
    metrics: {
      totalConversations: input.totalConversations,
      aiHandledConversations: input.aiHandledConversations,
      humanEscalations: input.humanEscalations,
      resolvedConversations: input.resolvedConversations,
      unansweredQuestionsCount: input.unansweredQuestions.length,
      leadsCaptured: input.leadsCaptured,
      avgResponseTimeSeconds:
        input.avgFirstResponseMs !== null
          ? Number((input.avgFirstResponseMs / 1000).toFixed(2))
          : null,
      nativeMessagesUsed: input.nativeMessagesUsed,
      enhancedMessagesUsed: input.enhancedMessagesUsed,
      remainingConversations: Math.max(0, input.conversationLimit - input.totalConversations),
      remainingMessages: Math.max(0, input.messageLimit - totalMessages),
    },
    commonEnquiries: input.commonIntents
      .filter((i) => i.count > 0)
      .slice(0, 5)
      .map((i) => ({
        topic: i.intent.replace(/_/g, " "),
        count: i.count,
      })),
    knowledgeGaps: input.unansweredQuestions.slice(0, 8).map((q) => q.question),
    suggestions,
  };
}
