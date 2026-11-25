import { describe, expect, it } from "vitest";
import { runNativeSageEngine } from "@/lib/intelligence/native/engine";
import {
  detectCustomerChallenge,
  interpretCustomerChallenges,
} from "@/lib/intelligence/native/consultative";
import type { AssistantSettings } from "@/types/database";
import type { WorkspaceKnowledgeBundle } from "@/lib/intelligence/native/knowledge-matcher";

const settings: AssistantSettings = {
  id: "s-cons",
  workspace_id: "w-cons",
  assistant_id: "a-cons",
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
    id: "bp-cons",
    workspace_id: "w-cons",
    business_name: "Lumina Skincare",
    industry: "Skincare & Beauty",
    description: "Botanical skincare studio.",
    website: null,
    business_email: "care@lumina.example",
    business_phone: null,
    country: "US",
    location_address: "42 Glow Ave",
    currency: "USD",
    operating_hours: { "Mon-Fri": "9:00 AM - 6:00 PM" },
    delivery_info: "Same-day express courier before 2 PM.",
    booking_info: "",
    return_policy: "14-day returns.",
    created_at: "",
    updated_at: "",
  },
  products: [
    {
      id: "p-vitc",
      workspace_id: "w-cons",
      name: "Vitamin C Serum",
      description: "Brightening daily serum for dull skin.",
      price: 38,
      currency: "USD",
      category: "Serums",
      availability: "in_stock",
      sku: null,
      keywords: ["dull skin", "brightening"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "p-hydra",
      workspace_id: "w-cons",
      name: "Hydra Barrier Cream",
      description: "Rich restorative moisturizer for dry skin.",
      price: 42,
      currency: "USD",
      category: "Moisturizers",
      availability: "in_stock",
      sku: null,
      keywords: ["dry skin", "hydrating"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
  services: [],
  faqs: [],
  knowledgeSources: [],
};

describe("Consultative Advisor, Active Listening & Data Interpretation", () => {
  it("actively listens, shows verified catalog value, and asks an insightful discovery question", () => {
    const out = runNativeSageEngine({
      message: "I am struggling with dull skin and not sure how to fix it",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });

    expect(out.intent).toBe("problem_discovery");
    expect(out.reply.toLowerCase()).toContain("understand");
    expect(out.reply).toContain("Vitamin C Serum");
    expect(out.reply).toContain("?");
    expect(out.updatedState.discovery?.stage).toBe("awaiting_details");
  });

  it("connects follow-up discovery answers directly to verified products and order next steps", () => {
    const followUp = runNativeSageEngine({
      message: "Mostly dry skin and I prefer something hydrating",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
      stateContext: {
        discovery: {
          stage: "awaiting_details",
          challengeTheme: "quality_or_result",
          challengePhrase: "feels dry",
        },
      },
    });

    expect(followUp.reply).toContain("Hydra Barrier Cream");
    expect(followUp.reply).toContain("feels dry");
    expect(followUp.updatedState.discovery?.stage).toBe("value_presented");
    expect(followUp.suggestedActions.some((a) => a.includes("Hydra Barrier Cream"))).toBe(true);
  });

  it("connects time/convenience challenges to verified delivery info", () => {
    const challenge = detectCustomerChallenge("I have no time to visit the store this week");
    expect(challenge?.theme).toBe("time_or_convenience");

    const out = runNativeSageEngine({
      message: "I have no time to visit the store for Vitamin C Serum",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });

    expect(out.reply).toContain("Same-day express courier");
    expect(out.reply).toContain("Vitamin C Serum");
  });

  it("interprets recorded customer messages into ranked business-outcome insights", () => {
    const insights = interpretCustomerChallenges([
      { content: "I have no time to pick up my order today" },
      { content: "My schedule is too busy for store pickup" },
      { content: "I am confused about which serum to pick" },
    ]);

    expect(insights.length).toBe(2);
    expect(insights[0].theme).toBe("Speed & Convenience Friction");
    expect(insights[0].mentions).toBe(2);
    expect(insights[0].businessOutcomeRecommendation).toContain("delivery");
  });
});
