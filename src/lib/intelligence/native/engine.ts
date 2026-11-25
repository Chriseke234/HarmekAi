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
import { detectMultipleIntents, type NativeIntent } from "./intent-detector";
import {
  matchWorkspaceKnowledge,
  type KnowledgeMatchCandidate,
  type WorkspaceKnowledgeBundle,
} from "./knowledge-matcher";
import { formatCurrency } from "@/lib/utils";
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
  suggestedActions: string[];
}

/**
 * Generates contextual, tappable quick-reply chips tailored to the business's real catalog.
 */
export function buildSuggestedActions(
  knowledge: WorkspaceKnowledgeBundle,
  currentIntent: NativeIntent,
  referencedItemName?: string
): string[] {
  const chips: string[] = [];
  if (referencedItemName && currentIntent !== "order_intent") {
    chips.push(`I want to order ${referencedItemName}`);
  }
  if (knowledge.products.some((p) => p.is_active) && currentIntent !== "catalog_browse") {
    chips.push("What do you sell?");
  }
  if (knowledge.businessProfile?.delivery_info?.trim() && currentIntent !== "delivery_info") {
    chips.push("Delivery info");
  }
  if (
    knowledge.businessProfile &&
    Object.keys(knowledge.businessProfile.operating_hours ?? {}).length > 0 &&
    currentIntent !== "business_hours"
  ) {
    chips.push("Opening hours");
  }
  if (currentIntent !== "human_handoff") {
    chips.push("Speak to a human");
  }
  return chips.slice(0, 3);
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
      suggestedActions: buildSuggestedActions(input.knowledge, "unknown"),
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
      suggestedActions: ["Speak to a human"],
    };
  }

  // 3. Multi-intent classification (handles compound customer questions)
  const detectedIntents = detectMultipleIntents(
    cleanMessage,
    input.settings.escalation_keywords ?? []
  );
  const intentResult = detectedIntents[0];

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
      suggestedActions: [],
    };
  }

  // 4a. Guided Order / Buying Intent Flow (verified subtotal + out-of-stock waitlist + lead capture)
  if (intentResult.intent === "order_intent") {
    const queryWithContext = prevState.lastReferencedItem
      ? `${cleanMessage} ${prevState.lastReferencedItem.name}`
      : cleanMessage;
    const itemMatch = matchWorkspaceKnowledge(queryWithContext, "product_info", input.knowledge).find(
      (c) => c.type === "product" || c.type === "service"
    );
    const qty = entities.quantity ?? Number(cleanMessage.match(/\b(\d{1,2})\b/)?.[1] ?? 1);

    if (itemMatch?.product && itemMatch.product.availability === "out_of_stock") {
      return {
        reply: renderGroundedAnswer(
          `${itemMatch.product.name} is currently out of stock. If you share your email or phone number, our team at ${businessName} will notify you the moment it is back in stock.`,
          renderOpts
        ),
        intent: "order_intent",
        confidence: 0.9,
        sources: [{ type: "product", id: itemMatch.product.id, title: itemMatch.product.name, score: 0.9 }],
        matchedCandidates: [itemMatch],
        extractedEntities: entities,
        shouldEscalate: false,
        escalationReason: null,
        isUnanswered: false,
        updatedState: {
          ...prevState,
          lastIntent: "order_intent",
          leadCaptureStep: "email",
          consecutiveFallbacks: 0,
        },
        suggestedActions: ["What else do you sell?", "Speak to a human"],
      };
    }

    if (itemMatch) {
      const unitPrice = itemMatch.product?.price ?? itemMatch.service?.price ?? null;
      const currency = itemMatch.product?.currency ?? itemMatch.service?.currency ?? "USD";
      const subtotalLine =
        unitPrice !== null
          ? ` for ${qty} × ${formatCurrency(unitPrice, currency)} = ${formatCurrency(unitPrice * qty, currency)}`
          : "";
      const hasContact = Boolean(entities.email || entities.phone);
      const nextPrompt = hasContact
        ? `I have recorded your contact details and flagged this order enquiry for our ${businessName} team to confirm payment and delivery shortly.`
        : `To reserve this enquiry for our team to confirm payment and fulfillment, please reply with your name and email or phone number.`;

      return {
        reply: renderGroundedAnswer(
          `Great choice! I can prepare an order enquiry for ${itemMatch.title}${subtotalLine}. ${nextPrompt}`,
          renderOpts
        ),
        intent: "order_intent",
        confidence: 0.92,
        sources: [{ type: itemMatch.type, id: itemMatch.id, title: itemMatch.title, score: 0.92 }],
        matchedCandidates: [itemMatch],
        extractedEntities: entities,
        shouldEscalate: hasContact,
        escalationReason: hasContact
          ? `High-intent order enquiry for ${itemMatch.title}${subtotalLine}`
          : null,
        isUnanswered: false,
        updatedState: {
          ...prevState,
          lastIntent: "order_intent",
          lastReferencedItem: {
            type: itemMatch.type as "product" | "service",
            id: itemMatch.id,
            name: itemMatch.title,
          },
          leadCaptureStep: hasContact ? "complete" : "email",
          consecutiveFallbacks: 0,
        },
        suggestedActions: ["Delivery info", "Speak to a human"],
      };
    }
  }

  // 4b. Side-by-Side Product / Service Comparison
  if (intentResult.intent === "compare_items") {
    const matchedItems = matchWorkspaceKnowledge(cleanMessage, "product_info", input.knowledge)
      .filter((c) => c.type === "product" || c.type === "service")
      .slice(0, 2);

    if (matchedItems.length >= 2) {
      const [first, second] = matchedItems;
      return {
        reply: renderGroundedAnswer(
          `Here is a quick side-by-side comparison:\n• ${first.title}: ${first.answerText}\n• ${second.title}: ${second.answerText}\n\nWhich one feels like the better fit for you?`,
          renderOpts
        ),
        intent: "compare_items",
        confidence: 0.88,
        sources: matchedItems.map((m) => ({
          type: m.type,
          id: m.id,
          title: m.title,
          score: m.score,
        })),
        matchedCandidates: matchedItems,
        extractedEntities: entities,
        shouldEscalate: false,
        escalationReason: null,
        isUnanswered: false,
        updatedState: { ...prevState, lastIntent: "compare_items", consecutiveFallbacks: 0 },
        suggestedActions: [
          `I want to order ${first.title}`,
          `I want to order ${second.title}`,
        ],
      };
    }
  }

  // 4c. Budget / Affordable Options Filter
  if (intentResult.intent === "budget_query") {
    const capMatch = cleanMessage.match(/(?:under|below|less than)\s*[$£€₦]?\s*(\d+(?:\.\d{1,2})?)/i);
    const budgetCap = capMatch ? Number.parseFloat(capMatch[1]) : null;
    const pricedItems = [
      ...input.knowledge.products
        .filter((p) => p.is_active && p.price !== null)
        .map((p) => ({
          id: p.id,
          type: "product" as const,
          name: p.name,
          price: p.price!,
          currency: p.currency,
        })),
      ...input.knowledge.services
        .filter((s) => s.is_active && s.price !== null)
        .map((s) => ({
          id: s.id,
          type: "service" as const,
          name: s.name,
          price: s.price!,
          currency: s.currency,
        })),
    ].sort((a, b) => a.price - b.price);

    const matchingBudget =
      budgetCap !== null
        ? pricedItems.filter((item) => item.price <= budgetCap)
        : pricedItems.slice(0, 3);

    if (matchingBudget.length > 0) {
      const list = matchingBudget
        .slice(0, 4)
        .map((it) => `• ${it.name} — ${formatCurrency(it.price, it.currency)}`)
        .join("\n");
      const intro =
        budgetCap !== null
          ? `Here are our verified options priced at or under ${budgetCap}:`
          : `Here are our most affordable verified options:`;
      return {
        reply: renderGroundedAnswer(`${intro}\n${list}`, renderOpts),
        intent: "budget_query",
        confidence: 0.88,
        sources: matchingBudget.slice(0, 3).map((it) => ({
          type: it.type,
          id: it.id,
          title: it.name,
          score: 0.88,
        })),
        matchedCandidates: [],
        extractedEntities: entities,
        shouldEscalate: false,
        escalationReason: null,
        isUnanswered: false,
        updatedState: { ...prevState, lastIntent: "budget_query", consecutiveFallbacks: 0 },
        suggestedActions: [
          `I want to order ${matchingBudget[0].name}`,
          "Delivery info",
        ],
      };
    }
  }

  // 4d. Catalog Browse ("What do you sell?" / "Show me your prices")
  if (intentResult.intent === "catalog_browse") {
    const activeProducts = input.knowledge.products.filter((p) => p.is_active);
    const activeServices = input.knowledge.services.filter((s) => s.is_active);
    const lines = [
      ...activeProducts
        .slice(0, 4)
        .map((p) => `• ${p.name} — ${formatCurrency(p.price, p.currency)}`),
      ...activeServices
        .slice(0, 3)
        .map((s) => `• ${s.name} — ${formatCurrency(s.price, s.currency)}`),
    ];
    if (lines.length > 0) {
      return {
        reply: renderGroundedAnswer(
          `Here is a look at what we offer at ${businessName}:\n${lines.join("\n")}\n\nLet me know which one you would like details on or want to order.`,
          renderOpts
        ),
        intent: "catalog_browse",
        confidence: 0.9,
        sources: [],
        matchedCandidates: [],
        extractedEntities: entities,
        shouldEscalate: false,
        escalationReason: null,
        isUnanswered: false,
        updatedState: { ...prevState, lastIntent: "catalog_browse", consecutiveFallbacks: 0 },
        suggestedActions: [
          activeProducts[0] ? `How much is ${activeProducts[0].name}?` : "Opening hours",
          "Delivery info",
          "Speak to a human",
        ],
      };
    }
  }

  // 4e. Guided catalog recommendation flow (zero-LLM consultative selling)
  if (intentResult.intent === "recommendation") {
    const activeProducts = input.knowledge.products.filter((p) => p.is_active);
    const activeServices = input.knowledge.services.filter((s) => s.is_active);
    const catalogMatches = matchWorkspaceKnowledge(cleanMessage, "product_info", input.knowledge)
      .filter((c) => c.type === "product" || c.type === "service")
      .slice(0, 3);

    if (catalogMatches.length > 0) {
      const lines = catalogMatches.map((m) => `• ${m.title}: ${m.answerText}`);
      return {
        reply: renderGroundedAnswer(
          `Based on what you mentioned, here are our best matching options:\n${lines.join("\n")}\n\nWould you like details on any of these, or prefer to leave your email so our team can tailor a recommendation?`,
          renderOpts
        ),
        intent: "recommendation",
        confidence: Math.max(0.75, catalogMatches[0].score),
        sources: catalogMatches.map((m) => ({
          type: m.type,
          id: m.id,
          title: m.title,
          score: m.score,
        })),
        matchedCandidates: catalogMatches,
        extractedEntities: entities,
        shouldEscalate: false,
        escalationReason: null,
        isUnanswered: false,
        updatedState: {
          ...prevState,
          lastIntent: "recommendation",
          lastReferencedItem: {
            type: catalogMatches[0].type as "product" | "service",
            id: catalogMatches[0].id,
            name: catalogMatches[0].title,
          },
          consecutiveFallbacks: 0,
        },
        suggestedActions: buildSuggestedActions(
          input.knowledge,
          "recommendation",
          catalogMatches[0].title
        ),
      };
    }

    if (activeProducts.length > 0 || activeServices.length > 0) {
      const topOptions = [
        ...activeProducts.slice(0, 2).map((p) => `${p.name} (${formatCurrency(p.price, p.currency)})`),
        ...activeServices.slice(0, 2).map((s) => `${s.name} (${formatCurrency(s.price, s.currency)})`),
      ];
      return {
        reply: renderGroundedAnswer(
          `I would be glad to help you choose! Popular options at ${businessName} include: ${topOptions.join(", ")}. What specific goal or preference are you looking for?`,
          renderOpts
        ),
        intent: "recommendation",
        confidence: 0.72,
        sources: [],
        matchedCandidates: [],
        extractedEntities: entities,
        shouldEscalate: false,
        escalationReason: null,
        isUnanswered: false,
        updatedState: { ...prevState, lastIntent: "recommendation", consecutiveFallbacks: 0 },
        suggestedActions: buildSuggestedActions(input.knowledge, "recommendation"),
      };
    }
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
      suggestedActions: buildSuggestedActions(input.knowledge, "greeting"),
    };
  }

  if (intentResult.intent === "acknowledgement") {
    return {
      reply: `I am right here whenever you are ready! Would you like to explore our catalog, ask a question, or start an order enquiry?`,
      intent: "acknowledgement",
      confidence: 0.9,
      sources: [],
      matchedCandidates: [],
      extractedEntities: entities,
      shouldEscalate: false,
      escalationReason: null,
      isUnanswered: false,
      updatedState: { ...prevState, lastIntent: "acknowledgement", consecutiveFallbacks: 0 },
      suggestedActions: buildSuggestedActions(
        input.knowledge,
        "acknowledgement",
        prevState.lastReferencedItem?.name
      ),
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
      suggestedActions: buildSuggestedActions(input.knowledge, "gratitude"),
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
      suggestedActions: [],
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
      suggestedActions: buildSuggestedActions(input.knowledge, "lead_submission"),
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

  // 7. Match against structured business knowledge (with multi-intent synthesis for compound queries)
  const primaryCandidates = matchWorkspaceKnowledge(
    effectiveQuery,
    intentResult.intent,
    input.knowledge
  );
  const top = primaryCandidates[0];
  const autoThreshold = Number(input.settings.auto_answer_threshold ?? 0.65);
  const clarifyThreshold = Number(input.settings.clarification_threshold ?? 0.35);

  // Check if a secondary distinct business intent was also asked in the same message
  const secondaryIntent = detectedIntents.find(
    (d) =>
      d.intent !== intentResult.intent &&
      [
        "business_hours",
        "delivery_info",
        "booking_info",
        "location_contact",
        "policy_query",
      ].includes(d.intent)
  );
  const secondaryTop = secondaryIntent
    ? matchWorkspaceKnowledge(effectiveQuery, secondaryIntent.intent, input.knowledge).find(
        (c) => c.id !== top?.id && c.title !== top?.title && c.score >= autoThreshold
      )
    : undefined;

  const candidates = primaryCandidates;

  // High confidence: return grounded answer (combining secondary verified intent when present)
  if (top && top.score >= autoThreshold) {
    const combinedCandidates = secondaryTop ? [top, secondaryTop] : candidates.slice(0, 3);
    const topSources: KnowledgeSourceRef[] = combinedCandidates.map((c) => ({
      type: c.type,
      id: c.id,
      title: c.title,
      score: c.score,
    }));

    // Smart Cross-Sell: when a customer enquires about an in-stock product, gently mention a complementary item
    let crossSellSuffix = "";
    if (top.type === "product" && top.product && top.product.availability !== "out_of_stock") {
      const complementary = input.knowledge.products.find(
        (p) => p.is_active && p.id !== top.product!.id && p.availability !== "out_of_stock"
      );
      if (complementary) {
        crossSellSuffix = `\n\nCustomers also frequently pair this with ${complementary.name} (${formatCurrency(
          complementary.price,
          complementary.currency
        )}).`;
      }
    } else if (top.type === "product" && top.product?.availability === "out_of_stock") {
      crossSellSuffix =
        "\n\nShare your email or phone if you would like us to notify you as soon as it restocks.";
    }

    const answerCore = secondaryTop
      ? `${top.answerText}\n\nAdditionally — ${secondaryTop.answerText}${crossSellSuffix}`
      : `${top.answerText}${crossSellSuffix}`;

    return {
      reply: renderGroundedAnswer(answerCore, renderOpts),
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
      suggestedActions: buildSuggestedActions(
        input.knowledge,
        intentResult.intent,
        top.type === "product" || top.type === "service" ? top.title : undefined
      ),
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
      suggestedActions: clarifyCandidates.map((c) => c.title).slice(0, 3),
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
    suggestedActions: ["What do you sell?", "Speak to a human"],
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

export interface AgentHandoffBrief {
  customerGoal: string;
  factsAlreadyShared: string[];
  recommendedAction: string;
  suggestedReplies: string[];
}

/**
 * Generates an instant 3-point Agent Handoff Brief + grounded 1-click Suggested Replies
 * when a human takes over a conversation (zero LLM required).
 */
export function buildAgentHandoffBrief(
  messages: Pick<Message, "sender_type" | "content" | "intent" | "knowledge_source_refs">[],
  businessName: string
): AgentHandoffBrief {
  const customerMsgs = messages.filter((m) => m.sender_type === "customer");
  const assistantMsgs = messages.filter((m) => m.sender_type === "assistant");
  const lastCustomer = customerMsgs[customerMsgs.length - 1]?.content ?? "General enquiry";

  const sharedTitles = Array.from(
    new Set(
      assistantMsgs.flatMap((m) =>
        Array.isArray(m.knowledge_source_refs)
          ? m.knowledge_source_refs.map((r) => r.title)
          : []
      )
    )
  ).slice(0, 4);

  const suggestedReplies = [
    `Hello! I am stepping in personally from the ${businessName} team to help with your question about "${lastCustomer.slice(0, 60)}".`,
    `Thanks for your patience — let me verify those exact details for you right now and follow up immediately.`,
    `Could you share your preferred contact email or phone number so we can send you a direct confirmation?`,
  ];

  return {
    customerGoal: lastCustomer.slice(0, 180),
    factsAlreadyShared:
      sharedTitles.length > 0 ? sharedTitles : ["No verified catalog items matched yet"],
    recommendedAction:
      sharedTitles.length === 0
        ? "Answer the customer directly and consider approving this reply as a new FAQ."
        : "Confirm order/booking specifics or address the customer's custom request.",
    suggestedReplies,
  };
}

/**
 * Self-Healing Knowledge Loop: extracts a clean FAQ draft from an escalated/unanswered
 * conversation once a human agent resolves it with a verified answer.
 */
export function extractFaqDraftFromResolution(
  messages: Pick<Message, "sender_type" | "content">[]
): { question: string; answer: string } | null {
  const lastAgent = [...messages].reverse().find((m) => m.sender_type === "agent");
  if (!lastAgent || lastAgent.content.trim().length < 10) return null;

  const lastAgentIdx = messages.lastIndexOf(lastAgent);
  const precedingCustomer = messages
    .slice(0, lastAgentIdx)
    .reverse()
    .find((m) => m.sender_type === "customer" && m.content.trim().length >= 8);

  if (!precedingCustomer) return null;

  return {
    question: precedingCustomer.content.trim().slice(0, 400),
    answer: lastAgent.content.trim().slice(0, 1800),
  };
}
