import { describe, expect, it } from "vitest";
import { runNativeSageEngine } from "@/lib/intelligence/native/engine";
import type { AssistantSettings } from "@/types/database";
import type { WorkspaceKnowledgeBundle } from "@/lib/intelligence/native/knowledge-matcher";

const settings: AssistantSettings = {
  id: "s-rev",
  workspace_id: "w-rev",
  assistant_id: "a-rev",
  tone: "friendly",
  custom_tone_notes: "",
  formality: "balanced",
  response_length: "concise",
  welcome_message: "Welcome to Lumina Skincare!",
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
    id: "bp-rev",
    workspace_id: "w-rev",
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
    delivery_info: "Same-day local delivery before 2 PM.",
    booking_info: "",
    return_policy: "14-day returns.",
    created_at: "",
    updated_at: "",
  },
  products: [
    {
      id: "p1",
      workspace_id: "w-rev",
      name: "Vitamin C Serum",
      description: "Brightening 15% Vitamin C botanical serum.",
      price: 38,
      currency: "USD",
      category: "Serums",
      availability: "in_stock",
      sku: null,
      keywords: ["brightening"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "p2",
      workspace_id: "w-rev",
      name: "Hydra Rose Mist",
      description: "Soothing daily facial mist.",
      price: 22,
      currency: "USD",
      category: "Toners",
      availability: "in_stock",
      sku: null,
      keywords: ["mist", "hydrating"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "p3",
      workspace_id: "w-rev",
      name: "Night Repair Oil",
      description: "Restorative overnight botanical oil.",
      price: 54,
      currency: "USD",
      category: "Oils",
      availability: "out_of_stock",
      sku: null,
      keywords: ["night", "oil"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
  services: [],
  faqs: [],
  knowledgeSources: [],
};

describe("Base Conversation & Business Revenue Engine", () => {
  it("calculates verified subtotals on buying intent and prompts for contact details", () => {
    const out = runNativeSageEngine({
      message: "I want to buy 2 bottles of Vitamin C Serum",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });

    expect(out.intent).toBe("order_intent");
    expect(out.reply).toContain("$76.00");
    expect(out.reply.toLowerCase()).toContain("name and email or phone");
    expect(out.suggestedActions.length).toBeGreaterThan(0);
  });

  it("captures out-of-stock waitlist enquiries instead of a dead end", () => {
    const out = runNativeSageEngine({
      message: "I want to order Night Repair Oil",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });

    expect(out.reply.toLowerCase()).toContain("out of stock");
    expect(out.reply.toLowerCase()).toContain("notify you");
  });

  it("adds smart cross-sell suggestion on in-stock product price queries", () => {
    const out = runNativeSageEngine({
      message: "How much is Vitamin C Serum?",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });

    expect(out.reply).toContain("$38.00");
    expect(out.reply).toContain("Hydra Rose Mist");
    expect(out.suggestedActions.some((a) => a.includes("Vitamin C Serum"))).toBe(true);
  });

  it("compares two catalog items side-by-side and filters by customer budget", () => {
    const comp = runNativeSageEngine({
      message: "Compare Vitamin C Serum vs Hydra Rose Mist",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });
    expect(comp.intent).toBe("compare_items");
    expect(comp.reply).toContain("Vitamin C Serum");
    expect(comp.reply).toContain("Hydra Rose Mist");

    const budget = runNativeSageEngine({
      message: "Do you have anything under $30?",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });
    expect(budget.intent).toBe("budget_query");
    expect(budget.reply).toContain("Hydra Rose Mist");
    expect(budget.reply).not.toContain("Night Repair Oil");
  });

  it("handles catalog browsing and natural acknowledgements cleanly", () => {
    const browse = runNativeSageEngine({
      message: "What do you sell?",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });
    expect(browse.intent).toBe("catalog_browse");
    expect(browse.reply).toContain("Vitamin C Serum");

    const ack = runNativeSageEngine({
      message: "Okay, are you there?",
      assistant: { name: "Harmek" },
      settings,
      knowledge,
    });
    expect(ack.intent).toBe("acknowledgement");
    expect(ack.suggestedActions.length).toBeGreaterThan(0);
  });
});
