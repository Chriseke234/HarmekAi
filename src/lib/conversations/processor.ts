import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/security/crypto";
import { routeIntelligenceRequest } from "@/lib/intelligence/router";
import { buildNativeConversationSummary } from "@/lib/intelligence/native/engine";
import { mapIntentToCategory } from "@/lib/automations/engine";
import { evaluateTrialStatus } from "@/lib/billing/trial";
import type {
  Assistant,
  AssistantSettings,
  BusinessProfile,
  Conversation,
  FaqItem,
  KnowledgeSource,
  Message,
  Product,
  Service,
  TrialRecord,
} from "@/types/database";

/**
 * Loads the complete structured knowledge bundle + assistant config for a workspace.
 */
export async function loadWorkspaceIntelligenceContext(workspaceId: string) {
  const admin = createSupabaseAdminClient();

  const [
    { data: assistant },
    { data: settings },
    { data: businessProfile },
    { data: products },
    { data: services },
    { data: faqs },
    { data: knowledgeSources },
    { data: knowledgeChunks },
    { data: trialRecord },
  ] = await Promise.all([
    admin.from("assistants").select("*").eq("workspace_id", workspaceId).single<Assistant>(),
    admin
      .from("assistant_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single<AssistantSettings>(),
    admin
      .from("business_profiles")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle<BusinessProfile>(),
    admin.from("products").select("*").eq("workspace_id", workspaceId).eq("is_active", true),
    admin.from("services").select("*").eq("workspace_id", workspaceId).eq("is_active", true),
    admin.from("faqs").select("*").eq("workspace_id", workspaceId).eq("is_active", true),
    admin
      .from("knowledge_sources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "indexed"),
    admin
      .from("knowledge_chunks")
      .select("id, source_id, chunk_index, content")
      .eq("workspace_id", workspaceId)
      .limit(500),
    admin
      .from("trial_records")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle<TrialRecord>(),
  ]);

  let enhancedApiKey: string | null = null;
  if (settings?.intelligence_mode === "enhanced" && settings.enhanced_provider) {
    const { data: cred } = await admin
      .from("workspace_ai_credentials")
      .select("encrypted_api_key")
      .eq("workspace_id", workspaceId)
      .eq("provider", settings.enhanced_provider)
      .maybeSingle<{ encrypted_api_key: string }>();

    if (cred?.encrypted_api_key) {
      try {
        enhancedApiKey = decryptSecret(cred.encrypted_api_key);
      } catch {
        enhancedApiKey = null;
      }
    } else {
      // Optional platform-managed fallback env key
      const envMap = {
        openai: process.env.OPENAI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
        gemini: process.env.GEMINI_API_KEY,
      };
      enhancedApiKey = envMap[settings.enhanced_provider] || null;
    }
  }

  return {
    assistant,
    settings,
    knowledge: {
      businessProfile: businessProfile ?? null,
      products: (products ?? []) as Product[],
      services: (services ?? []) as Service[],
      faqs: (faqs ?? []) as FaqItem[],
      knowledgeSources: (knowledgeSources ?? []) as KnowledgeSource[],
      knowledgeChunks: (knowledgeChunks ?? []) as Array<{
        id: string;
        source_id: string;
        chunk_index: number;
        content: string;
      }>,
    },
    trialRecord: trialRecord ?? null,
    enhancedApiKey,
  };
}

/**
 * Processes an inbound customer message end-to-end:
 * 1. Persists the customer message.
 * 2. Respects Human Takeover lock (halts AI if a human owns the conversation).
 * 3. Runs Intelligence Router (Native default, optional Enhanced AI with Native fallback).
 * 4. Updates contact details if lead entities were captured.
 * 5. Records unanswered questions, analytics events, usage records, and automation logs.
 */
export async function processCustomerMessage(params: {
  workspaceId: string;
  conversationId: string;
  content: string;
}) {
  const admin = createSupabaseAdminClient();
  const startedAt = Date.now();

  const { data: conversation } = await admin
    .from("conversations")
    .select("*")
    .eq("id", params.conversationId)
    .eq("workspace_id", params.workspaceId)
    .single<Conversation>();

  if (!conversation) {
    throw new Error("Conversation not found in this workspace.");
  }

  // Save incoming customer message
  const { data: customerMsg, error: msgError } = await admin
    .from("messages")
    .insert({
      workspace_id: params.workspaceId,
      conversation_id: conversation.id,
      sender_type: "customer",
      content: params.content,
    })
    .select("*")
    .single<Message>();

  if (msgError || !customerMsg) {
    throw new Error(msgError?.message ?? "Failed to persist customer message.");
  }

  const ctx = await loadWorkspaceIntelligenceContext(params.workspaceId);
  if (!ctx.assistant || !ctx.settings) {
    throw new Error("Workspace assistant is not configured.");
  }

  // Check trial expiration before auto-responding on live channels
  const trialStatus = evaluateTrialStatus(ctx.trialRecord);
  if (conversation.channel !== "simulator" && trialStatus.isExpired) {
    await admin
      .from("conversations")
      .update({
        status: "waiting_for_human",
        unread_count: (conversation.unread_count ?? 0) + 1,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    return {
      customerMessage: customerMsg,
      assistantMessage: null,
      suppressed: true,
      reason: "Trial expired — conversation routed to human inbox.",
    };
  }

  // Fetch recent messages for context & summary
  const { data: recentRows } = await admin
    .from("messages")
    .select("sender_type, content, intent")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(20);

  const recentHistory = (recentRows ?? [])
    .filter((m) => m.sender_type === "customer" || m.sender_type === "assistant")
    .map((m) => ({
      role: (m.sender_type === "customer" ? "user" : "assistant") as "user" | "assistant",
      content: m.content as string,
    }));

  const routeResult = await routeIntelligenceRequest({
    message: params.content,
    assistant: ctx.assistant,
    settings: ctx.settings,
    knowledge: ctx.knowledge,
    conversation,
    recentHistory,
    enhancedApiKey: ctx.enhancedApiKey,
    isSimulator: conversation.channel === "simulator",
  });

  // Update contact if customer provided lead info (name, email, phone)
  let leadCapturedNow = false;
  if (
    conversation.contact_id &&
    (routeResult.extractedEntities.email ||
      routeResult.extractedEntities.phone ||
      routeResult.extractedEntities.name)
  ) {
    const contactUpdates: Record<string, unknown> = {
      last_interaction_at: new Date().toISOString(),
    };
    if (routeResult.extractedEntities.name) {
      contactUpdates.full_name = routeResult.extractedEntities.name;
    }
    if (routeResult.extractedEntities.email) {
      contactUpdates.email = routeResult.extractedEntities.email;
    }
    if (routeResult.extractedEntities.phone) {
      contactUpdates.phone = routeResult.extractedEntities.phone;
    }
    await admin
      .from("contacts")
      .update(contactUpdates)
      .eq("id", conversation.contact_id)
      .eq("workspace_id", params.workspaceId);
    leadCapturedNow = true;
  }

  // If suppressed due to human takeover, update unread count & return without AI message
  if (routeResult.suppressed || !routeResult.reply) {
    await admin
      .from("conversations")
      .update({
        unread_count: (conversation.unread_count ?? 0) + 1,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    return {
      customerMessage: customerMsg,
      assistantMessage: null,
      suppressed: true,
      reason: routeResult.suppressionReason,
    };
  }

  // Persist assistant reply
  const { data: assistantMsg } = await admin
    .from("messages")
    .insert({
      workspace_id: params.workspaceId,
      conversation_id: conversation.id,
      sender_type: "assistant",
      content: routeResult.reply,
      intelligence_mode: routeResult.intelligenceModeUsed,
      intent: routeResult.intent,
      confidence: routeResult.confidence,
      knowledge_source_refs: routeResult.sources,
    })
    .select("*")
    .single<Message>();

  const elapsedMs = Date.now() - startedAt;
  const nextStatus = routeResult.shouldEscalate ? "waiting_for_human" : "ai_handling";
  const nextSummary = buildNativeConversationSummary([
    ...((recentRows ?? []) as Pick<Message, "sender_type" | "content" | "intent">[]),
    {
      sender_type: "assistant",
      content: routeResult.reply,
      intent: routeResult.intent,
    },
  ]);

  await admin
    .from("conversations")
    .update({
      status: nextStatus,
      human_takeover: routeResult.shouldEscalate ? true : conversation.human_takeover,
      category: conversation.category || mapIntentToCategory(routeResult.intent),
      summary: nextSummary,
      lead_captured: conversation.lead_captured || leadCapturedNow,
      first_response_ms: conversation.first_response_ms ?? elapsedMs,
      unread_count: routeResult.shouldEscalate ? (conversation.unread_count ?? 0) + 1 : 0,
      state_context: routeResult.updatedState,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversation.id);

  // Record usage
  await admin.from("usage_records").insert({
    workspace_id: params.workspaceId,
    metric_type:
      routeResult.intelligenceModeUsed === "enhanced" ? "enhanced_message" : "native_message",
    intelligence_mode: routeResult.intelligenceModeUsed,
    quantity: 1,
    tokens_used: routeResult.tokensUsed,
    estimated_cost_usd: routeResult.estimatedCostUsd,
  });

  // Record unanswered question (Knowledge Gap)
  if (routeResult.isUnanswered) {
    await admin.from("unanswered_questions").insert({
      workspace_id: params.workspaceId,
      conversation_id: conversation.id,
      question: params.content,
      detected_intent: routeResult.intent,
      confidence: routeResult.confidence,
      status: "open",
    });
  }

  // Record escalation notification & analytics event
  if (routeResult.shouldEscalate) {
    await admin.from("notifications").insert({
      workspace_id: params.workspaceId,
      type: "human_handoff",
      title: "Customer conversation escalated",
      body: routeResult.escalationReason || "A customer requested human assistance.",
      metadata: { conversation_id: conversation.id },
    });
    await admin.from("analytics_events").insert({
      workspace_id: params.workspaceId,
      conversation_id: conversation.id,
      event_type: "conversation_escalated",
      metadata: { reason: routeResult.escalationReason, intent: routeResult.intent },
    });
  } else {
    await admin.from("analytics_events").insert({
      workspace_id: params.workspaceId,
      conversation_id: conversation.id,
      event_type: "ai_message_sent",
      metadata: {
        mode: routeResult.intelligenceModeUsed,
        intent: routeResult.intent,
        confidence: routeResult.confidence,
      },
    });
  }

  if (routeResult.fallbackTriggered && routeResult.fallbackError) {
    await admin.from("system_error_logs").insert({
      workspace_id: params.workspaceId,
      component: "intelligence_router",
      severity: "warn",
      message: routeResult.fallbackError,
      details: { conversation_id: conversation.id },
    });
  }

  return {
    customerMessage: customerMsg,
    assistantMessage: assistantMsg,
    suppressed: false,
    routeResult,
  };
}
