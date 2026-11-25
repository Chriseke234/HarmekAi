import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURE_GROUPS = [
  {
    name: "Dual Intelligence Architecture",
    items: [
      {
        title: "Native Harmek Intelligence Engine",
        body: "Intent recognition, fuzzy lexical matching, entity extraction, confidence thresholds, and clarification workflows — running natively without an external LLM API.",
      },
      {
        title: "Optional Enhanced AI Adapters",
        body: "Connect OpenAI, Anthropic, or Gemini with AES-256 encrypted server-side keys, connection testing, and automatic fallback to Native Harmek.",
      },
      {
        title: "Strict Anti-Hallucination Guardrails",
        body: "Prompt-injection filtering, avoided-topic rules, and verified-source grounding ensure Harmek never invents prices, stock, bookings, or policies.",
      },
    ],
  },
  {
    name: "Operations & Customer Conversations",
    items: [
      {
        title: "Unified Inbox & Human Takeover",
        body: "Search and filter chats, assign agents, record internal notes, and take over any conversation with one click while Harmek pauses automatically.",
      },
      {
        title: "Structured Knowledge Base",
        body: "Organize Products, Services, Prices, FAQs, Policies, Delivery Info, and Booking Rules with SHA-256 duplicate detection and an interactive retrieval tester.",
      },
      {
        title: "Embeddable Website Chat Widget",
        body: "Single copy-paste script tag with custom branding, consent-aware persistence, responsive mobile layout, and zero exposed API keys.",
      },
    ],
  },
  {
    name: "Governance, Automations & Analytics",
    items: [
      {
        title: "Guided Business Automations",
        body: "Plain-language toggles for welcoming visitors, capturing leads, escalating unanswered questions, notifying staff, and categorizing enquiries.",
      },
      {
        title: "Honest Analytics & Knowledge Gaps",
        body: "Real database metrics separating Handled, Resolved, Lead Captured, and Sale Completed, paired with an actionable Knowledge Gap report.",
      },
      {
        title: "Multi-Tenant Workspace Isolation",
        body: "Isolated business workspaces enforced at the database layer via Supabase PostgreSQL Row Level Security and Owner, Admin, and Agent roles.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl font-normal text-[#F5F2EB] sm:text-5xl">
          Everything a business needs to handle customer enquiries reliably.
        </h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[#B5AEA2]">
          Built for clarity, accuracy, and daily operational use by non-technical teams.
        </p>
      </div>

      <div className="mt-16 space-y-16">
        {FEATURE_GROUPS.map((group) => (
          <section key={group.name} className="border-t border-[#2B2722] pt-10">
            <h2 className="font-display text-2xl font-normal text-[#D97745]">{group.name}</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {group.items.map((item) => (
                <div key={item.title} className="space-y-2">
                  <h3 className="text-base font-semibold text-[#F5F2EB]">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#B5AEA2]">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-20 flex flex-col items-start justify-between gap-6 rounded-xl border border-[#2B2722] bg-[#181613] p-8 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-display text-2xl font-normal text-[#F5F2EB]">
            Ready to test Harmek with your own catalog?
          </h3>
          <p className="mt-1 text-sm text-[#B5AEA2]">
            Start free with no credit card required.
          </p>
        </div>
        <Link href="/get-started">
          <Button size="lg">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
