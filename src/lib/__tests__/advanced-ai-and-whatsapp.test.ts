import crypto from "crypto";
import { describe, expect, it } from "vitest";
import {
  buildAgentHandoffBrief,
  extractFaqDraftFromResolution,
  runNativeSageEngine,
} from "@/lib/intelligence/native/engine";
import { verifyEnhancedReplyFacts } from "@/lib/intelligence/providers/fact-verifier";
import { routeIntelligenceRequest } from "@/lib/intelligence/router";
import {
  extractWhatsAppMessages,
  verifyMetaWebhookSignature,
} from "@/lib/integrations/whatsapp";
import type { AssistantSettings } from "@/types/database";
import type { WorkspaceKnowledgeBundle } from "@/lib/intelligence/native/knowledge-matcher";
import type { EnhancedAIProvider } from "@/lib/intelligence/providers/types";

const settings: AssistantSettings = {
  id: "s-adv",
  workspace_id: "w-adv",
  assistant_id: "a-adv",
  tone: "friendly",
  custom_tone_notes: "",
  formality: "balanced",
  response_length: "concise",
  welcome_message: "Welcome to Lumina.",
  supported_languages: ["English"],
  business_objectives: "",
  allowed_topics: [],
  avoided_topics: [],
  lead_capture_fields: ["name", "email"],
  clarification_enabled: true,
  auto_answer_threshold: 0.6,
  clarification_threshold: 0.35,
  escalation_keywords: ["human"],
  max_consecutive_fallbacks: 2,
  intelligence_mode: "native",
  enhanced_provider: null,
  enhanced_model: null,
  widget_primary_color: "#D97745",
  widget_position: "bottom-right",
  widget_require_consent: true,
  created_at: "",
  updated_at: "",
};

const knowledge: WorkspaceKnowledgeBundle = {
  businessProfile: {
    id: "bp-adv",
    workspace_id: "w-adv",
    business_name: "Lumina Skincare",
    industry: "Skincare & Beauty",
    description: "Botanical skincare.",
    website: null,
    business_email: "care@lumina.example",
    business_phone: null,
    country: "US",
    location_address: "42 Glow Ave",
    currency: "USD",
    operating_hours: { "Mon-Fri": "9:00 AM - 6:00 PM" },
    delivery_info: "Same-day dispatch for orders placed before 2 PM.",
    booking_info: "",
    return_policy: "14-day unopened returns.",
    created_at: "",
    updated_at: "",
  },
  products: [
    {
      id: "p-vitc",
      workspace_id: "w-adv",
      name: "Vitamin C Serum",
      description: "Brightening serum for dull skin.",
      price: 38,
      currency: "USD",
      category: "Serums",
      availability: "in_stock",
      sku: null,
      keywords: ["brightening", "glow"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
  services: [],
  faqs: [],
  knowledgeSources: [],
};

describe("Advanced Harmek AI Capabilities", () => {
  it("answers multi-intent compound queries (product price + operating hours) in one reply", () => {
    const out = runNativeSageEngine({
      message: "How much is Vitamin C Serum and what are your opening hours?",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });

    expect(out.reply).toContain("$38.00");
    expect(out.reply).toContain("9:00 AM - 6:00 PM");
    expect(out.sources.length).toBeGreaterThanOrEqual(2);
  });

  it("handles guided product recommendations natively without an LLM", () => {
    const out = runNativeSageEngine({
      message: "What do you recommend for brightening dull skin?",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });

    expect(out.intent).toBe("recommendation");
    expect(out.reply).toContain("Vitamin C Serum");
  });

  it("blocks hallucinated LLM prices via Post-Generation Fact Verifier and falls back to Native", async () => {
    const badCheck = verifyEnhancedReplyFacts(
      "Vitamin C Serum is currently on special for $19.99!",
      knowledge
    );
    expect(badCheck.verified).toBe(false);

    const hallucinatingProvider: EnhancedAIProvider = {
      name: "openai",
      defaultModel: "gpt-4o-mini",
      async generateResponse() {
        return {
          reply: "Vitamin C Serum is only $12.00 today!",
          tokensUsed: 90,
          estimatedCostUsd: 0.00004,
          modelUsed: "gpt-4o-mini",
        };
      },
      async testConnection() {
        return { ok: true, provider: "openai", model: "gpt-4o-mini", message: "ok" };
      },
    };

    const routed = await routeIntelligenceRequest({
      message: "How much is Vitamin C Serum?",
      assistant: { name: "Harmek", is_active: true },
      settings: { ...settings, intelligence_mode: "enhanced", enhanced_provider: "openai" },
      knowledge,
      enhancedApiKey: "sk-test",
      providerOverride: hallucinatingProvider,
    });

    expect(routed.fallbackTriggered).toBe(true);
    expect(routed.intelligenceModeUsed).toBe("native");
    expect(routed.reply).toContain("$38.00");
    expect(routed.reply).not.toContain("$12.00");
  });

  it("generates Agent Handoff Briefs and Self-Healing FAQ drafts from resolved chats", () => {
    const msgs = [
      {
        sender_type: "customer" as const,
        content: "Do you ship internationally to Canada?",
        intent: "delivery_info",
        knowledge_source_refs: [],
      },
      {
        sender_type: "agent" as const,
        content: "Yes, we ship to Canada via DHL Express in 3 to 5 business days.",
        intent: null,
        knowledge_source_refs: [],
      },
    ];

    const brief = buildAgentHandoffBrief(msgs, "Lumina Skincare");
    expect(brief.customerGoal).toContain("Canada");
    expect(brief.suggestedReplies.length).toBeGreaterThan(0);

    const draft = extractFaqDraftFromResolution(msgs);
    expect(draft?.question).toContain("Canada");
    expect(draft?.answer).toContain("DHL Express");
  });
});

describe("Official Meta WhatsApp Cloud API Helpers", () => {
  it("verifies valid X-Hub-Signature-256 HMAC signatures and rejects tampered payloads", () => {
    const secret = "test-meta-secret";
    const body = JSON.stringify({ object: "whatsapp_business_account" });
    const sig = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;

    expect(verifyMetaWebhookSignature(body, sig, secret)).toBe(true);
    expect(verifyMetaWebhookSignature(body + "tampered", sig, secret)).toBe(false);
  });

  it("extracts inbound customer text messages from Meta Cloud API webhook payloads", () => {
    const samplePayload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "1234567890" },
                contacts: [{ wa_id: "2348012345678", profile: { name: "Chidi" } }],
                messages: [
                  {
                    id: "wamid.1",
                    from: "2348012345678",
                    type: "text",
                    text: { body: "How much is Vitamin C Serum?" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const msgs = extractWhatsAppMessages(samplePayload);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].phoneNumberId).toBe("1234567890");
    expect(msgs[0].senderName).toBe("Chidi");
    expect(msgs[0].text).toBe("How much is Vitamin C Serum?");
  });
});
