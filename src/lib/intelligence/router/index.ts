import type {
  Assistant,
  AssistantSettings,
  Conversation,
  ConversationStateContext,
  IntelligenceMode,
  KnowledgeSourceRef,
} from "@/types/database";
import { runNativeSageEngine, type NativeEngineOutput } from "../native/engine";
import type { WorkspaceKnowledgeBundle } from "../native/knowledge-matcher";
import { getEnhancedProvider } from "../providers/adapters";
import { verifyEnhancedReplyFacts } from "../providers/fact-verifier";
import type { EnhancedAIProvider } from "../providers/types";

export interface RouterInput {
  message: string;
  assistant: Pick<Assistant, "name" | "is_active">;
  settings: AssistantSettings;
  knowledge: WorkspaceKnowledgeBundle;
  conversation?: Pick<Conversation, "status" | "human_takeover" | "state_context">;
  recentHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Server-side decrypted API key (only passed if Enhanced AI is enabled & configured). */
  enhancedApiKey?: string | null;
  /** Optional provider override for deterministic unit testing. */
  providerOverride?: EnhancedAIProvider;
  /** True when testing inside onboarding or assistant simulator. */
  isSimulator?: boolean;
}

export interface RouterOutput {
  suppressed: boolean;
  suppressionReason: string | null;
  reply: string | null;
  intelligenceModeUsed: IntelligenceMode;
  fallbackTriggered: boolean;
  fallbackError: string | null;
  intent: NativeEngineOutput["intent"];
  confidence: number;
  sources: KnowledgeSourceRef[];
  extractedEntities: NativeEngineOutput["extractedEntities"];
  shouldEscalate: boolean;
  escalationReason: string | null;
  isUnanswered: boolean;
  updatedState: ConversationStateContext;
  tokensUsed: number;
  estimatedCostUsd: number;
}

/**
 * Dual-mode Intelligence Router.
 * 1. Enforces Human Takeover lock (AI never replies while a human agent owns the thread).
 * 2. Runs Native Harmek Engine first for zero-LLM grounding, guardrails, and entity extraction.
 * 3. Optionally invokes Enhanced AI if enabled & configured, with automatic fallback to Native.
 */
export async function routeIntelligenceRequest(input: RouterInput): Promise<RouterOutput> {
  const conv = input.conversation;

  // Hard Human Takeover Lock: Sage MUST NOT send customer-facing messages while a human is in control.
  if (
    !input.isSimulator &&
    conv &&
    (conv.human_takeover || conv.status === "waiting_for_human" || conv.status === "assigned")
  ) {
    return {
      suppressed: true,
      suppressionReason: "Human agent is currently handling this conversation.",
      reply: null,
      intelligenceModeUsed: "native",
      fallbackTriggered: false,
      fallbackError: null,
      intent: "unknown",
      confidence: 0,
      sources: [],
      extractedEntities: { email: null, phone: null, name: null, quantity: null },
      shouldEscalate: false,
      escalationReason: null,
      isUnanswered: false,
      updatedState: conv.state_context ?? {},
      tokensUsed: 0,
      estimatedCostUsd: 0,
    };
  }

  // Always run the Native Harmek Engine first for deterministic guardrails, entity extraction, and structured grounding.
  const nativeResult = runNativeSageEngine({
    message: input.message,
    assistant: input.assistant,
    settings: input.settings,
    knowledge: input.knowledge,
    stateContext: conv?.state_context,
  });

  // If Enhanced AI is not enabled, or if escalation/guardrail already triggered, return Native result directly.
  const canUseEnhanced =
    input.settings.intelligence_mode === "enhanced" &&
    Boolean(input.settings.enhanced_provider) &&
    Boolean(input.enhancedApiKey) &&
    !nativeResult.shouldEscalate;

  if (!canUseEnhanced) {
    return {
      suppressed: false,
      suppressionReason: null,
      reply: nativeResult.reply,
      intelligenceModeUsed: "native",
      fallbackTriggered:
        input.settings.intelligence_mode === "enhanced" && !input.enhancedApiKey,
      fallbackError:
        input.settings.intelligence_mode === "enhanced" && !input.enhancedApiKey
          ? "Enhanced AI is enabled without a configured API key; fell back to Native Harmek Engine."
          : null,
      intent: nativeResult.intent,
      confidence: nativeResult.confidence,
      sources: nativeResult.sources,
      extractedEntities: nativeResult.extractedEntities,
      shouldEscalate: nativeResult.shouldEscalate,
      escalationReason: nativeResult.escalationReason,
      isUnanswered: nativeResult.isUnanswered,
      updatedState: nativeResult.updatedState,
      tokensUsed: 0,
      estimatedCostUsd: 0,
    };
  }

  // Attempt Enhanced AI with guaranteed graceful fallback to Native Harmek Engine
  try {
    const provider =
      input.providerOverride ?? getEnhancedProvider(input.settings.enhanced_provider!);

    const enhanced = await provider.generateResponse({
      apiKey: input.enhancedApiKey!,
      model: input.settings.enhanced_model,
      customerMessage: input.message,
      assistantName: input.assistant.name,
      settings: input.settings,
      knowledge: input.knowledge,
      topMatches: nativeResult.matchedCandidates,
      recentHistory: input.recentHistory ?? [],
    });

    // Post-Generation Fact Verifier: block hallucinated prices and fall back to verified Native reply
    const factCheck = verifyEnhancedReplyFacts(enhanced.reply, input.knowledge);
    if (!factCheck.verified) {
      return {
        suppressed: false,
        suppressionReason: null,
        reply: nativeResult.reply,
        intelligenceModeUsed: "native",
        fallbackTriggered: true,
        fallbackError: `Fact verifier blocked unverified Enhanced AI response: ${factCheck.violations.join(" ")}`,
        intent: nativeResult.intent,
        confidence: nativeResult.confidence,
        sources: nativeResult.sources,
        extractedEntities: nativeResult.extractedEntities,
        shouldEscalate: nativeResult.shouldEscalate,
        escalationReason: nativeResult.escalationReason,
        isUnanswered: nativeResult.isUnanswered,
        updatedState: nativeResult.updatedState,
        tokensUsed: enhanced.tokensUsed,
        estimatedCostUsd: enhanced.estimatedCostUsd,
      };
    }

    return {
      suppressed: false,
      suppressionReason: null,
      reply: enhanced.reply,
      intelligenceModeUsed: "enhanced",
      fallbackTriggered: false,
      fallbackError: null,
      intent: nativeResult.intent,
      confidence: Math.max(nativeResult.confidence, 0.7),
      sources: nativeResult.sources,
      extractedEntities: nativeResult.extractedEntities,
      shouldEscalate: nativeResult.shouldEscalate,
      escalationReason: nativeResult.escalationReason,
      isUnanswered: nativeResult.isUnanswered,
      updatedState: nativeResult.updatedState,
      tokensUsed: enhanced.tokensUsed,
      estimatedCostUsd: enhanced.estimatedCostUsd,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enhanced AI provider error";
    return {
      suppressed: false,
      suppressionReason: null,
      reply: nativeResult.reply,
      intelligenceModeUsed: "native",
      fallbackTriggered: true,
      fallbackError: message,
      intent: nativeResult.intent,
      confidence: nativeResult.confidence,
      sources: nativeResult.sources,
      extractedEntities: nativeResult.extractedEntities,
      shouldEscalate: nativeResult.shouldEscalate,
      escalationReason: nativeResult.escalationReason,
      isUnanswered: nativeResult.isUnanswered,
      updatedState: nativeResult.updatedState,
      tokensUsed: 0,
      estimatedCostUsd: 0,
    };
  }
}
