import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmberFox } from "@/components/brand/ember-fox";

const CAPABILITY_ROWS = [
  {
    title: "Native Intelligence — Zero LLM API Required",
    detail:
      "Answers product, pricing, service, FAQ, delivery, and policy enquiries directly from your structured business records. Optional Enhanced AI (OpenAI, Anthropic, Gemini) plugs in whenever you choose and falls back cleanly if unavailable.",
    tag: "Default Engine",
  },
  {
    title: "Unified Inbox with Instant Human Takeover",
    detail:
      "Every website chat lands in one calm workspace inbox. Step in at any moment and Harmek immediately pauses automated replies until an authorized team member hands control back.",
    tag: "Human First",
  },
  {
    title: "Strict Grounding & Knowledge Gap Reports",
    detail:
      "Harmek never invents prices, availability, bookings, or policies. Unmatched questions are acknowledged honestly, escalated when appropriate, and logged so you can close gaps in one click.",
    tag: "Verified Truth",
  },
  {
    title: "Real Database Analytics, Never Fabricated ROI",
    detail:
      "Distinguishes clearly between conversations handled, issues resolved, leads captured, and staff-verified sales completed — backed by real database events and an end-of-trial performance report.",
    tag: "Honest Metrics",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Editorial Split Hero */}
      <section className="border-b border-[#262626]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-28">
          <div className="lg:col-span-7">
            <h1 className="font-display text-5xl font-normal leading-[1.06] text-[#FAFAFA] sm:text-6xl lg:text-[4.25rem]">
              Your business, always within reach.
            </h1>
            <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[#A3A3A3]">
              Harmek AI answers customer questions from your verified catalog, captures leads,
              and hands conversations to your team the moment a human is needed — working out
              of the box without requiring an external LLM API.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/get-started">
                <Button size="lg" className="w-full sm:w-auto">
                  Start 14-Day Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  How Harmek Works
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#262626] pt-6 text-xs text-[#A3A3A3]">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#D4D4D4]" />
                No credit card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#D4D4D4]" />
                Trial starts only on activation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#D4D4D4]" />
                No prompt engineering
              </span>
            </div>
          </div>

          {/* Grounded Visual Proof Panel */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#121212]">
              <div className="relative h-64 w-full sm:h-72">
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80"
                  alt="Business owner serving customers with calm precision"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/25 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#FAFAFA]/90">
                    Native Harmek Engine
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#121212]/90 px-2.5 py-1 text-[11px] font-medium text-[#D4D4D4] border border-[#D4D4D4]/30">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Catalog Grounded
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[#262626] px-5 py-4 text-sm">
                <div className="pb-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#8F8F8F]">
                    Customer Enquiry
                  </p>
                  <p className="mt-1 text-[#FAFAFA]">
                    &ldquo;How much is the Vitamin C Serum and do you offer same-day
                    delivery?&rdquo;
                  </p>
                </div>
                <div className="pt-3.5">
                  <div className="flex items-start gap-3">
                    <EmberFox mood="friendly" size={38} />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#FFFFFF]">
                        Harmek AI &bull; Verified Response
                      </p>
                      <p className="mt-1 leading-relaxed text-[#A3A3A3]">
                        Vitamin C Serum is <span className="font-mono text-[#FAFAFA]">$38.00</span>{" "}
                        and currently in stock. Same-day local delivery is available for orders
                        placed before 2 PM.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Ruled Capability List (No generic icon-card grid) */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-normal text-[#FAFAFA] sm:text-4xl">
            Designed for real businesses, not prompt engineers.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#A3A3A3]">
            Structure your products, services, prices, and policies in plain language. Embed a
            lightweight chat widget in minutes.
          </p>
        </div>

        <div className="mt-12 divide-y divide-[#262626] border-y border-[#262626]">
          {CAPABILITY_ROWS.map((row) => (
            <div
              key={row.title}
              className="grid gap-4 py-7 md:grid-cols-12 md:items-baseline"
            >
              <div className="md:col-span-5">
                <h3 className="text-lg font-semibold text-[#FAFAFA]">{row.title}</h3>
              </div>
              <div className="md:col-span-5">
                <p className="text-sm leading-relaxed text-[#A3A3A3]">{row.detail}</p>
              </div>
              <div className="md:col-span-2 md:text-right">
                <span className="font-mono text-xs text-[#D4D4D4]">{row.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dual Intelligence Architectural Contrast */}
      <section className="border-y border-[#262626] bg-[#121212]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="font-display text-3xl font-normal text-[#FAFAFA] sm:text-4xl">
                Reliable natively. Optionally enhanced.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#A3A3A3]">
                Your customer communication never breaks if an external AI provider goes down
                or has no key configured.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
              <div className="rounded-xl border border-[#D4D4D4]/35 bg-[#0E0E0E] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#FAFAFA]">
                    Native Harmek Engine
                  </h3>
                  <span className="font-mono text-xs text-[#D4D4D4]">Included Default</span>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-[#A3A3A3]">
                  Deterministic intent detection, fuzzy catalog matching, entity extraction,
                  confidence thresholds, and clarification prompts — zero API keys required.
                </p>
              </div>

              <div className="rounded-xl border border-[#262626] bg-[#0E0E0E] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#FAFAFA]">
                    Enhanced AI Layer
                  </h3>
                  <span className="font-mono text-xs text-[#FFFFFF]">Optional Add-On</span>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-[#A3A3A3]">
                  Connect OpenAI, Anthropic, or Gemini with AES-256 encrypted server-side keys,
                  grounded business rules, and automatic fallback to Native Harmek.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Conversion Band */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 rounded-xl border border-[#262626] bg-[#121212] p-8 sm:p-12 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-normal text-[#FAFAFA] sm:text-4xl">
              Test Harmek with your real catalog before going live.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#A3A3A3]">
              Set up your workspace, add your products and FAQs, and run live conversations in
              the simulator. Your 14-day trial begins only when you activate Harmek.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/get-started">
              <Button size="lg">
                Create Free Workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
