import type {
  Assistant,
  AssistantSettings,
  ConversationStateContext,
  KnowledgeSourceRef,
  Message,
} from "@/types/database";
import {
  detectAvoidedTopic,
  detectPromptInjection,
  sanitizeUserText,
} from "@/lib/security/sanitize";
import { extractEntities, type ExtractedEntities } from "./entity-extractor";
import { detectIntent, type NativeIntent } from "./intent-detector";
import {
  matchWorkspaceKnowledge,
  type KnowledgeMatchCandidate,
  type WorkspaceKnowledgeBundle,
} from "./knowledge-matcher";
import {
  getToneProfile,
  renderClarification,
  renderGroundedAnswer,
  type RenderOptions,
} from "./response-renderer";

export interface NativeEngineInput {
  message: string;
  assistant: Pick<Assistant, "name">;
  settings: AssistantSettings;
  knowledge: WorkspaceKnowledgeBundle;
  stateContext?: ConversationStateContext;
}

export interface NativeEngineOutput {
  reply: string;
  intent: NativeIntent;
  confidence: number;
  sources: KnowledgeSourceRef[];
  matchedCandidates: KnowledgeMatchCandidate[];
  extractedEntities: ExtractedEntities;
  shouldEscalate: boolean;
  escalationReason: string | null;
  isUnanswered: boolean;
  updatedState: ConversationStateContext;
}

/**
 * Core Native Harmek Intelligence Engine.
 * Operates 100% locally on structured business knowledge with zero external LLM dependency.
 */
export function runNativeSageEngine(input: NativeEngineInput): NativeEngineOutput {
  const cleanMessage = sanitizeUserText(input.message);
  const prevState: ConversationStateContext = input.stateContext ?? {};
  const businessName = input.knowledge.businessProfile?.business_name ?? "our business";
  const renderOpts: RenderOptions = {
    tone: input.settings.tone,
    formality: input.settings.formality,
    responseLength: input.settings.response_length,
    assistantName: input.assistant.name,
    businessName,
    welcomeMessage: input.settings.welcome_message,
  };
  const toneProfile = getToneProfile(input.settings.tone);
  const entities = extractEntities(cleanMessage);

  // 1. Prompt-injection guardrail
  if (detectPromptInjection(cleanMessage)) {
    return {
      reply:
        "I can only help with verified questions about our products, services, and business information. How can I assist you with those?",
      intent: "unknown",
      confidence: 1,
      sources: [],
      matchedCandidates: [],
      extractedEntities: entities,
      shouldEscalate: false,
      escalationReason: null,
      isUnanswered: false,
      updatedState: { ...prevState, lastIntent: "unknown" },
    };
  }

  // 2. Avoided-topics guardrail
  const avoided = detectAvoidedTopic(cleanMessage, input.settings.avoided_topics ?? []);
  if (avoided) {
    return {
      reply: toneProfile.avoidedTopicReply,
      intent: "unknown",
      confidence: 0.95,
      sources: [],
      matchedCandidates: [],
      extractedEntities: entities,
      shouldEscalate: true,
      escalationReason: `Customer asked about avoided topic: ${avoided}`,
      isUnanswered: false,
      updatedState: { ...prevState, lastIntent: "avoided_topic" },
    };
  }

  // 3. Intent classification
  const intentResult = detectIntent(cleanMessage, input.settings.escalation_keywords ?? []);

  // 4. Direct human handoff or urgent complaint escalation
  if (intentResult.intent === "human_handoff" || intentResult.intent === "complaint_urgent") {
    return {
      reply: toneProfile.handoffReply,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      sources: [],
      matchedCandidates: [],
      extractedEntities: entities,
      shouldEscalate: true,
      escalationReason:
        intentResult.intent === "complaint_urgent"
          ? "Urgent or sensitive customer issue detected"
          : "Customer requested a human team member",
      isUnanswered: false,
      updatedState: {
        ...prevState,
        lastIntent: intentResult.intent,
        awaitingClarification: false,
      },
    };
  }

  // 5. Simple conversational intents
  if (intentResult.intent === "greeting") {
    const greeting =
      input.settings.welcome_message?.trim() ||
      `${toneProfile.greetingPrefix} I am ${input.assistant.name} from ${businessName}. How can I help you today?`;
    return {
      reply: greeting,
      intent: "greeting",
      confidence: 0.95,
      sources: [],
      matchedCandidates: [],
      extractedEntities: entities,
      shouldEscalate: false,
      escalationReason: null,
      isUnanswered: false,
      updatedState: { ...prevState, lastIntent: "greeting", consecutiveFallbacks: 0 },
    };
  }

  if (intentResult.intent === "gratitude") {
    return {
      reply: toneProfile.gratitudeReply,
      intent: "gratitude",
      confidence: 0.92,
      sources: [],
      matchedCandidates: [],
      extractedEntities: entities,
      shouldEscalate: false,
      escalationReason: null,
      isUnanswered: false,
      updatedState: { ...prevState, lastIntent: "gratitude", consecutiveFallbacks: 0 },
    };
  }

  if (intentResult.intent === "farewell") {
    return {
      reply: toneProfile.farewellReply,
      intent: "farewell",
      confidence: 0.92,
      sources: [],
      matchedCandidates: [],
      extractedEntities: entities,
      shouldEscalate: false,
      escalationReason: null,
      isUnanswered: false,
      updatedState: { ...prevState, lastIntent: "farewell", consecutiveFallbacks: 0 },
    };
  }

  if (intentResult.intent === "lead_submission" && (entities.email || entities.phone)) {
    const capturedParts: string[] = [];
    if (entities.name) capturedParts.push(`name (${entities.name})`);
    if (entities.email) capturedParts.push(`email (${entities.email})`);
    if (entities.phone) capturedParts.push(`phone (${entities.phone})`);
    return {
      reply: `Thank you for sharing your ${capturedParts.join(" and ")}. I have saved your details for the ${businessName} team. How else can I assist you?`,
      intent: "lead_submission",
      confidence: 0.9,
      sources: [],
      matchedCandidates: [],
      extractedEntities: entities,
      shouldEscalate: false,
      escalationReason: null,
      isUnanswered: false,
      updatedState: {
        ...prevState,
        lastIntent: "lead_submission",
        leadCaptureStep: "complete",
        consecutiveFallbacks: 0,
      },
    };
  }

  // 6. Contextual follow-up expansion (e.g., customer asks "How much is it?" after discussing a product)
  let effectiveQuery = cleanMessage;
  if (
    prevState.lastReferencedItem &&
    /\b(it|that|this|one|them|those)\b/i.test(cleanMessage) &&
    cleanMessage.split(/\s+/).length <= 8
  ) {
    effectiveQuery = `${cleanMessage} ${prevState.lastReferencedItem.name}`;
  }

  // 7. Match against structured business knowledge
  const candidates = matchWorkspaceKnowledge(effectiveQuery, intentResult.intent, input.knowledge);
  const top = candidates[0];
  const autoThreshold = Number(input.settings.auto_answer_threshold ?? 0.65);
  const clarifyThreshold = Number(input.settings.clarification_threshold ?? 0.35);

  // High confidence: return grounded answer
  if (top && top.score >= autoThreshold) {
    const topSources: KnowledgeSourceRef[] = candidates.slice(0, 3).map((c) => ({
      type: c.type,
      id: c.id,
      title: c.title,
      score: c.score,
    }));

    return {
      reply: renderGroundedAnswer(top.answerText, renderOpts),
      intent: intentResult.intent,
      confidence: top.score,
      sources: topSources,
      matchedCandidates: candidates.slice(0, 3),
      extractedEntities: entities,
      shouldEscalate: false,
      escalationReason: null,
      isUnanswered: false,
      updatedState: {
        ...prevState,
        lastIntent: intentResult.intent,
        lastReferencedItem:
          top.type === "product" || top.type === "service" || top.type === "faq"
            ? { type: top.type, id: top.id, name: top.title }
            : prevState.lastReferencedItem,
        awaitingClarification: false,
        consecutiveFallbacks: 0,
      },
    };
  }

  // Medium confidence: ask clarifying question instead of guessing
  if (top && top.score >= clarifyThreshold && input.settings.clarification_enabled) {
    const clarifyCandidates = candidates.slice(0, 3);
    return {
      reply: renderClarification(
        clarifyCandidates.map((c) => c.title),
        renderOpts
      ),
      intent: intentResult.intent,
      confidence: top.score,
      sources: clarifyCandidates.map((c) => ({
        type: c.type,
        id: c.id,
        title: c.title,
        score: c.score,
      })),
      matchedCandidates: clarifyCandidates,
      extractedEntities: entities,
      shouldEscalate: false,
      escalationReason: null,
      isUnanswered: true,
      updatedState: {
        ...prevState,
        lastIntent: intentResult.intent,
        awaitingClarification: true,
        clarificationCandidates: clarifyCandidates.map((c) => ({
          id: c.id,
          name: c.title,
          type: c.type,
        })),
        consecutiveFallbacks: (prevState.consecutiveFallbacks ?? 0) + 1,
      },
    };
  }

  // Low confidence / no verified match: never invent facts; track unanswered question & escalate if repeated
  const nextFallbacks = (prevState.consecutiveFallbacks ?? 0) + 1;
  const maxFallbacks = input.settings.max_consecutive_fallbacks ?? 2;
  const shouldEscalate = nextFallbacks >= maxFallbacks;

  return {
    reply: shouldEscalate ? toneProfile.handoffReply : toneProfile.uncertaintyReply,
    intent: intentResult.intent,
    confidence: top?.score ?? 0,
    sources: [],
    matchedCandidates: [],
    extractedEntities: entities,
    shouldEscalate,
    escalationReason: shouldEscalate
      ? "Repeated unanswered customer questions exceeded escalation threshold"
      : null,
    isUnanswered: true,
    updatedState: {
      ...prevState,
      lastIntent: intentResult.intent,
      awaitingClarification: false,
      consecutiveFallbacks: nextFallbacks,
    },
  };
}

/**
 * Deterministic conversation summarizer (zero LLM required).
 * Generates a concise summary of customer intents and key questions for human agents.
 */
export function buildNativeConversationSummary(messages: Pick<Message, "sender_type" | "content" | "intent">[]): string {
  const customerMessages = messages.filter((m) => m.sender_type === "customer");
  if (customerMessages.length === 0) {
    return "No customer messages recorded yet.";
  }
  const intents = Array.from(
    new Set(
      messages
        .map((m) => m.intent)
        .filter((i): i is string => Boolean(i) && i !== "greeting" && i !== "unknown")
    )
  );
  const firstQuestion = customerMessages[0].content.slice(0, 120);
  const latestQuestion =
    customerMessages.length > 1
      ? customerMessages[customerMessages.length - 1].content.slice(0, 120)
      : null;

  const topicPart = intents.length > 0 ? `Topics: ${intents.join(", ").replace(/_/g, " ")}. ` : "";
  const latestPart = latestQuestion ? ` Latest message: "${latestQuestion}"` : "";
  return `${topicPart}Started with: "${firstQuestion}"${latestPart} (${customerMessages.length} customer message${customerMessages.length === 1 ? "" : "s"}).`;
}
