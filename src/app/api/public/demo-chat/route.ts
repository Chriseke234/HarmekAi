import { NextResponse } from "next/server";
import { z } from "zod";
import { runNativeSageEngine } from "@/lib/intelligence/native/engine";
import { checkRateLimit } from "@/lib/security/rate-limit";
import type { AssistantSettings, ConversationStateContext } from "@/types/database";
import type { WorkspaceKnowledgeBundle } from "@/lib/intelligence/native/knowledge-matcher";

const DemoChatSchema = z.object({
  message: z.string().min(1).max(600),
  stateContext: z.record(z.string(), z.unknown()).optional(),
});

const HARMEK_PUBLIC_SETTINGS: AssistantSettings = {
  id: "harmek-public",
  workspace_id: "harmek-public",
  assistant_id: "harmek-public",
  tone: "friendly",
  custom_tone_notes: "",
  formality: "balanced",
  response_length: "concise",
  welcome_message:
    "Hi! I am the HARMEK AI mascot assistant. Ask me about our pricing, 14-day free trial, Native Engine, WhatsApp integration, or how HARMEK works.",
  supported_languages: ["English"],
  business_objectives: "Help businesses understand HARMEK AI",
  allowed_topics: [],
  avoided_topics: [],
  lead_capture_fields: ["name", "email"],
  clarification_enabled: true,
  auto_answer_threshold: 0.55,
  clarification_threshold: 0.3,
  escalation_keywords: ["human", "support", "agent"],
  max_consecutive_fallbacks: 3,
  intelligence_mode: "native",
  enhanced_provider: null,
  enhanced_model: null,
  widget_primary_color: "#06B6D4",
  widget_position: "bottom-right",
  widget_require_consent: false,
  created_at: "",
  updated_at: "",
};

const HARMEK_PUBLIC_KNOWLEDGE: WorkspaceKnowledgeBundle = {
  businessProfile: {
    id: "harmek-bp",
    workspace_id: "harmek-public",
    business_name: "HARMEK AI",
    industry: "Customer Engagement SaaS",
    description:
      "HARMEK AI is a standalone multi-tenant customer engagement platform with a Native Intelligence Engine that works without requiring an external LLM API, plus optional Enhanced AI.",
    website: "https://harmekai.vercel.app",
    business_email: "ai.harmek.build@gmail.com",
    business_phone: null,
    country: "Global",
    location_address: "Cloud SaaS — Available Worldwide",
    currency: "USD",
    operating_hours: { "AI Assistant": "24/7", "Human Support": "Mon-Fri 9:00 AM - 6:00 PM" },
    delivery_info: "Instant cloud onboarding with a 1-line website chat widget embed script.",
    booking_info: "Start your 14-day free trial anytime at /get-started — no credit card required.",
    return_policy:
      "Your 14-day free trial begins only when you activate your assistant, and we never silently delete your data if a trial ends.",
    created_at: "",
    updated_at: "",
  },
  products: [
    {
      id: "plan-starter",
      workspace_id: "harmek-public",
      name: "Starter Plan",
      description:
        "Includes Native HARMEK Intelligence Engine, up to 1,000 conversations/month, website chat widget, unified inbox, human takeover, and 2 team members.",
      price: 29,
      currency: "USD",
      category: "Pricing",
      availability: "in_stock",
      sku: null,
      keywords: ["starter", "pricing", "plan", "cost", "monthly"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "plan-growth",
      workspace_id: "harmek-public",
      name: "Growth Plan",
      description:
        "Includes up to 5,000 conversations/month, optional Enhanced AI (OpenAI, Anthropic, Gemini), guided automations, knowledge gap reports, and up to 10 team members.",
      price: 79,
      currency: "USD",
      category: "Pricing",
      availability: "in_stock",
      sku: null,
      keywords: ["growth", "pricing", "plan", "enhanced ai"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "plan-scale",
      workspace_id: "harmek-public",
      name: "Scale Plan",
      description:
        "Includes up to 25,000 conversations/month, unlimited knowledge sources, webhooks & API access, and unlimited team members.",
      price: 199,
      currency: "USD",
      category: "Pricing",
      availability: "in_stock",
      sku: null,
      keywords: ["scale", "enterprise", "unlimited"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
  services: [],
  faqs: [
    {
      id: "faq-trial",
      workspace_id: "harmek-public",
      question: "How does the 14-day free trial work?",
      answer:
        "No credit card is required to start. Your 14-day trial begins only when you activate your assistant (not when you sign up), and finishes with a real Trial Performance Report.",
      category: "Trial",
      keywords: ["trial", "free", "14 day", "credit card"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "faq-llm",
      workspace_id: "harmek-public",
      question: "Do I need an OpenAI or LLM API key to use HARMEK AI?",
      answer:
        "No. HARMEK AI's Native Intelligence Engine works 100% out of the box without any external LLM API key. Optional Enhanced AI (OpenAI, Anthropic, or Gemini) can be enabled anytime with automatic fallback to Native HARMEK.",
      category: "Intelligence",
      keywords: ["llm", "api key", "openai", "native engine", "without llm"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "faq-whatsapp",
      workspace_id: "harmek-public",
      question: "Does HARMEK AI support WhatsApp and website chat?",
      answer:
        "Yes! Website chat installs with a single copy-and-paste script, and HARMEK includes official Meta WhatsApp Business Platform Cloud API webhook integration with HMAC signature verification.",
      category: "Integrations",
      keywords: ["whatsapp", "widget", "website chat", "integrations"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "faq-handoff",
      workspace_id: "harmek-public",
      question: "Can a human team member take over a conversation?",
      answer:
        "Yes. Click Take Over in the unified inbox and HARMEK immediately pauses automated replies while giving your agent a 3-point Handoff Brief and suggested replies until you hand control back.",
      category: "Inbox",
      keywords: ["human", "takeover", "handoff", "agent", "inbox"],
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ],
  knowledgeSources: [],
};

/**
 * Public homepage floating mascot chat endpoint.
 * Powered directly by HARMEK AI's zero-LLM Native Intelligence Engine.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`demo_chat:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many messages right now. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = DemoChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
    }

    const out = runNativeSageEngine({
      message: parsed.data.message,
      assistant: { name: "HARMEK" },
      settings: HARMEK_PUBLIC_SETTINGS,
      knowledge: HARMEK_PUBLIC_KNOWLEDGE,
      stateContext: (parsed.data.stateContext ?? {}) as ConversationStateContext,
    });

    return NextResponse.json({
      reply: out.reply,
      intent: out.intent,
      confidence: out.confidence,
      suggestedActions: [
        "How does the 14-day trial work?",
        "Do I need an LLM API key?",
        "What do you sell?",
      ],
      updatedState: out.updatedState,
    });
  } catch {
    return NextResponse.json({ error: "Unable to process message." }, { status: 500 });
  }
}
