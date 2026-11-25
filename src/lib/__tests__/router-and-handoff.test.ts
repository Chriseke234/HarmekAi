import { describe, expect, it } from "vitest";
import { routeIntelligenceRequest } from "@/lib/intelligence/router";
import type { AssistantSettings } from "@/types/database";
import type { EnhancedAIProvider } from "@/lib/intelligence/providers/types";

const settingsBase: AssistantSettings = {
  id: "s-1",
  workspace_id: "w-1",
  assistant_id: "a-1",
  tone: "professional",
  custom_tone_notes: "",
  formality: "balanced",
  response_length: "concise",
  welcome_message: "Welcome to Acme.",
  supported_languages: ["English"],
  business_objectives: "",
  allowed_topics: [],
  avoided_topics: [],
  lead_capture_fields: ["name", "email"],
  clarification_enabled: true,
  auto_answer_threshold: 0.65,
  clarification_threshold: 0.35,
  escalation_keywords: ["human"],
  max_consecutive_fallbacks: 2,
  intelligence_mode: "native",
  enhanced_provider: null,
  enhanced_model: null,
  widget_primary_color: "#7C3AED",
  widget_position: "bottom-right",
  widget_require_consent: true,
  created_at: "",
  updated_at: "",
};

const knowledge = {
  businessProfile: null,
  products: [
    {
      id: "p-1",
      workspace_id: "w-1",
      name: "Express Laundry Wash",
      description: "Same-day wash and fold.",
      price: 15,
      currency: "USD",
      category: "Laundry",
      availability: "in_stock" as const,
      sku: null,
      keywords: ["wash"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
  services: [],
  faqs: [],
  knowledgeSources: [],
};

describe("Intelligence Router & Human Takeover", () => {
  it("completely suppresses AI replies while human_takeover is active", async () => {
    const out = await routeIntelligenceRequest({
      message: "How much is Express Laundry Wash?",
      assistant: { name: "Sage", is_active: true },
      settings: settingsBase,
      knowledge,
      conversation: {
        status: "assigned",
        human_takeover: true,
        state_context: {},
      },
    });

    expect(out.suppressed).toBe(true);
    expect(out.reply).toBeNull();
  });

  it("resumes Native Sage Engine when human_takeover is false", async () => {
    const out = await routeIntelligenceRequest({
      message: "How much is Express Laundry Wash?",
      assistant: { name: "Sage", is_active: true },
      settings: settingsBase,
      knowledge,
      conversation: {
        status: "ai_handling",
        human_takeover: false,
        state_context: {},
      },
    });

    expect(out.suppressed).toBe(false);
    expect(out.intelligenceModeUsed).toBe("native");
    expect(out.reply).toContain("$15.00");
  });

  it("gracefully falls back to Native Engine if Enhanced AI provider fails", async () => {
    const failingProvider: EnhancedAIProvider = {
      name: "openai",
      defaultModel: "gpt-4o-mini",
      async generateResponse() {
        throw new Error("Upstream LLM timeout");
      },
      async testConnection() {
        return { ok: false, provider: "openai", model: "gpt-4o-mini", message: "fail" };
      },
    };

    const out = await routeIntelligenceRequest({
      message: "How much is Express Laundry Wash?",
      assistant: { name: "Sage", is_active: true },
      settings: {
        ...settingsBase,
        intelligence_mode: "enhanced",
        enhanced_provider: "openai",
      },
      knowledge,
      enhancedApiKey: "sk-test-key",
      providerOverride: failingProvider,
    });

    expect(out.intelligenceModeUsed).toBe("native");
    expect(out.fallbackTriggered).toBe(true);
    expect(out.fallbackError).toContain("Upstream LLM timeout");
    expect(out.reply).toContain("$15.00");
  });

  it("uses Enhanced AI provider when enabled and healthy", async () => {
    const healthyProvider: EnhancedAIProvider = {
      name: "openai",
      defaultModel: "gpt-4o-mini",
      async generateResponse() {
        return {
          reply: "Express Laundry Wash is $15.00 with same-day wash and fold.",
          tokensUsed: 120,
          estimatedCostUsd: 0.00005,
          modelUsed: "gpt-4o-mini",
        };
      },
      async testConnection() {
        return { ok: true, provider: "openai", model: "gpt-4o-mini", message: "ok" };
      },
    };

    const out = await routeIntelligenceRequest({
      message: "How much is Express Laundry Wash?",
      assistant: { name: "Sage", is_active: true },
      settings: {
        ...settingsBase,
        intelligence_mode: "enhanced",
        enhanced_provider: "openai",
      },
      knowledge,
      enhancedApiKey: "sk-test-key",
      providerOverride: healthyProvider,
    });

    expect(out.intelligenceModeUsed).toBe("enhanced");
    expect(out.fallbackTriggered).toBe(false);
    expect(out.tokensUsed).toBe(120);
    expect(out.reply).toContain("$15.00");
  });
});
