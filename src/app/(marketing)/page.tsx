import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Cpu,
  GitBranch,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { CinematicSignalCanvas } from "@/components/marketing/cinematic-canvas";
import { ScrollReveal } from "@/components/marketing/motion";
import { FloatingMascotChat } from "@/components/marketing/floating-mascot-chat";

const INTELLIGENCE_PILLARS = [
  {
    icon: Cpu,
    title: "Native HARMEK Intelligence Engine",
    description:
      "Operates out of the box with zero external LLM API required. Deterministic intent detection, BM25 catalog retrieval, entity extraction, and confidence thresholds work natively on your structured business data.",
    tag: "Default • Zero API Key",
  },
  {
    icon: Sparkles,
    title: "Optional Enhanced AI",
    description:
      "Connect OpenAI, Anthropic, or Google Gemini securely on the server side whenever you want deeper conversational nuance — protected by a post-generation fact verifier and automatic fallback to Native HARMEK.",
    tag: "Modular Add-On",
  },
  {
    icon: BookOpen,
    title: "Business-Specific Knowledge",
    description:
      "Grounds every answer in your verified products, services, prices, FAQs, policies, uploaded documents, and imported webpages — never guessing or inventing facts.",
    tag: "Verified Grounding",
  },
  {
    icon: UserCheck,
    title: "Intelligent Human Handoff",
    description:
      "Detects urgency, complex requests, or explicit requests for staff, then hands off seamlessly with a 3-point Agent Handoff Brief while pausing automated replies until control is returned.",
    tag: "Human-First Control",
  },
];

const CONVERSATION_STAGES = [
  {
    step: "01",
    title: "Respond to enquiries",
    description:
      "Greet website and messaging visitors immediately in your business's tone, day or night, with zero wait time.",
  },
  {
    step: "02",
    title: "Answer product and service questions",
    description:
      "Deliver exact catalog prices, availability, durations, delivery rules, and business policies directly from your verified records.",
  },
  {
    step: "03",
    title: "Capture leads",
    description:
      "Collect customer names, emails, and phone numbers naturally during high-intent buying or booking moments — always respecting consent.",
  },
  {
    step: "04",
    title: "Guide customer journeys",
    description:
      "Actively listen to customer challenges, compare options side-by-side, calculate verified subtotals, and suggest complementary items.",
  },
  {
    step: "05",
    title: "Escalate conversations to staff",
    description:
      "Hand off nuanced requests cleanly to your unified inbox, where staff can take over with one click and teach HARMEK from every resolution.",
  },
];

const BI_SIGNALS = [
  {
    icon: BarChart3,
    label: "Conversation analytics",
    detail: "Track real conversation volume, AI-handled vs. staff-handled ratios, and response times across custom date ranges.",
  },
  {
    icon: HelpCircle,
    label: "Knowledge gaps",
    detail: "Spot questions HARMEK could not answer with high confidence and turn them into verified FAQs in one click.",
  },
  {
    icon: GitBranch,
    label: "Customer enquiry patterns",
    detail: "Interpret recurring customer challenges and hesitations to uncover what drives demand across your catalog.",
  },
  {
    icon: Users,
    label: "Leads captured",
    detail: "Clearly separate conversations handled, issues resolved, leads captured, and staff-verified sales completed.",
  },
  {
    icon: MessageSquare,
    label: "Unanswered questions",
    detail: "Review every unmatched customer question transparently — never hidden, never fabricated.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#050C10] text-slate-100">
      {/* =====================================================================
          CINEMATIC FULL-SCREEN HERO + LOWER HERO COMPOSITION
         ===================================================================== */}
      <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-[#040B0F] pt-24 pb-10 sm:pt-28 sm:pb-12">
        {/* Original Generated Architectural Portal Backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            src="/harmek-hero-portal.jpg"
            alt="Luminous turquoise architectural portal representing HARMEK AI intelligent business communication"
            fill
            priority
            sizes="100vw"
            className="animate-harmek-drift object-cover object-center opacity-90"
          />
          {/* Atmospheric teal/charcoal depth vignettes for crisp typography legibility */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(4,19,24,0.22)_0%,rgba(4,12,16,0.62)_62%,rgba(4,10,14,0.92)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#040B0F]/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#050C10] via-[#050C10]/75 to-transparent" />
        </div>

        {/* Restrained Floating Particles & Interconnected Signal Lines */}
        <CinematicSignalCanvas />

        {/* Central Hero Typography */}
        <div className="relative z-10 mx-auto my-auto flex max-w-4xl flex-col items-center px-4 py-12 text-center sm:px-6 lg:py-16">
          <ScrollReveal delayMs={40} yOffset={16}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200/90 sm:text-xs">
              INTELLIGENCE THAT UNDERSTANDS YOUR BUSINESS
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={120} yOffset={20}>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] sm:text-6xl lg:text-[4.5rem] lg:leading-[1.06]">
              Every Conversation
              <br />
              Opens an Opportunity.
            </h1>
          </ScrollReveal>

          <ScrollReveal delayMs={200} yOffset={18}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-200/90 sm:text-lg">
              Meet HARMEK AI. Your intelligent business communication platform, designed to
              understand your business, engage customers and turn enquiries into meaningful
              opportunities.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={280} yOffset={16}>
            <div className="mt-9 flex flex-col items-center gap-3.5 sm:flex-row">
              <Link
                href="#discover"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 text-sm font-semibold text-[#041318] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300 shadow-[0_8px_32px_rgba(34,211,238,0.28)]"
              >
                Start Exploring
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-cyan-200/25 bg-[#06151B]/65 px-6 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/50 hover:bg-[#0A2029]/80"
              >
                See How It Works
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Lower Hero Content — Bottom-Left & Bottom-Right Editorial Anchors */}
        <ScrollReveal delayMs={320} yOffset={16} className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="grid items-end gap-8 border-t border-cyan-200/15 pt-7 md:grid-cols-12">
            {/* Bottom-Left */}
            <div className="md:col-span-7">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/90">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" aria-hidden="true" />
                THE POWER OF UNDERSTANDING
              </div>
              <h2 className="mt-2.5 text-2xl font-medium tracking-tight text-white sm:text-3xl lg:text-[2.1rem]">
                Beyond Automated Replies.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300/90 sm:text-base">
                From understanding customer enquiries to helping businesses build meaningful
                relationships, HARMEK makes every interaction count.
              </p>
            </div>

            {/* Bottom-Right */}
            <div className="flex flex-col items-start md:col-span-5 md:items-end md:text-right">
              <p className="max-w-sm text-xs leading-relaxed text-slate-300/85 sm:text-sm">
                Powered by its native intelligence engine, HARMEK understands your business and
                helps you respond with confidence.
              </p>
              <Link
                href="#discover"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-200/25 bg-[#071820]/70 px-4 py-2 text-xs font-medium text-cyan-100 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-[#0B232E]"
              >
                Discover HARMEK
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* =====================================================================
          SECTION A: INTRODUCTION — "Your Business. Understood."
         ===================================================================== */}
      <section
        id="discover"
        className="relative border-t border-cyan-300/10 bg-gradient-to-b from-[#050C10] to-[#071319] py-24 sm:py-32"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <ScrollReveal className="lg:col-span-6">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Your Business. Understood.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg">
              Most chat tools treat every business the same. HARMEK learns your exact products,
              services, pricing, operating hours, policies, and preferred tone of voice — turning
              your everyday business knowledge into calm, accurate customer conversations.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
              Set up in plain language without writing code or fragile prompts. Update a price,
              upload a CSV catalog, or import a webpage — and HARMEK reflects it immediately.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 border-t border-cyan-300/10 pt-6 text-xs text-cyan-100/85">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                Grounded in your verified records
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                Never invents prices or policies
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={140} className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#08161D]/90 p-6 transition-colors duration-300 hover:border-cyan-300/30 sm:p-8">
              <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-cyan-300/10 pb-4">
                  <span className="font-mono text-xs uppercase tracking-widest text-cyan-300">
                    Live Business Signal
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200">
                    Native Engine Active
                  </span>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="rounded-xl border border-white/10 bg-[#050E13] p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Customer asks
                    </p>
                    <p className="mt-1.5 text-white">
                      &ldquo;My skin has been feeling dry lately — what do you recommend, and
                      do you deliver today?&rdquo;
                    </p>
                  </div>

                  <div className="rounded-xl border border-cyan-400/25 bg-cyan-950/25 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-cyan-300">
                      HARMEK AI responds
                    </p>
                    <p className="mt-1.5 leading-relaxed text-slate-200">
                      &ldquo;I understand how frustrating dry skin can be. From our catalog,{" "}
                      <span className="font-medium text-white">Hydra Barrier Cream ($42.00)</span>{" "}
                      is formulated for deep hydration and is currently in stock. Same-day
                      courier delivery is available for orders placed before 2 PM.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* =====================================================================
          SECTION B: INTELLIGENCE — "Intelligence That Works Your Way."
         ===================================================================== */}
      <section className="relative border-t border-cyan-300/10 bg-[#061015] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Intelligence That Works Your Way.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
              HARMEK operates reliably without requiring an external LLM API. Start immediately
              with the Native HARMEK Intelligence Engine, and optionally connect an external AI
              provider only if and when your business wants it.
            </p>
          </ScrollReveal>

          <div className="mt-14 divide-y divide-cyan-300/10 border-y border-cyan-300/10">
            {INTELLIGENCE_PILLARS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={item.title} delayMs={idx * 70}>
                  <div className="grid gap-4 py-8 transition-colors duration-300 hover:bg-cyan-300/[0.03] md:grid-cols-12 md:items-baseline">
                    <div className="flex items-center gap-3 md:col-span-4">
                      <Icon className="h-5 w-5 shrink-0 text-cyan-400" />
                      <h3 className="text-lg font-medium text-white">{item.title}</h3>
                    </div>
                    <div className="md:col-span-6">
                      <p className="text-sm leading-relaxed text-slate-300">
                        {item.description}
                      </p>
                    </div>
                    <div className="md:col-span-2 md:text-right">
                      <span className="font-mono text-xs text-cyan-300/90">{item.tag}</span>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION C: CUSTOMER CONVERSATIONS — "Every Interaction Has Potential."
         ===================================================================== */}
      <section className="relative border-t border-cyan-300/10 bg-gradient-to-b from-[#061015] to-[#08171E] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <ScrollReveal className="lg:sticky lg:top-28">
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                  Every Interaction Has Potential.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-slate-300">
                  Move beyond static FAQ widgets. HARMEK guides each visitor through discovery,
                  answers real catalog questions, captures qualified leads, and escalates
                  seamlessly to your human team when personal attention matters most.
                </p>
                <div className="mt-8">
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200"
                  >
                    Explore all platform capabilities
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-7">
              <ol className="space-y-6">
                {CONVERSATION_STAGES.map((stage, idx) => (
                  <ScrollReveal key={stage.step} delayMs={idx * 70}>
                    <li className="group relative flex gap-5 rounded-2xl border border-cyan-300/12 bg-[#061218]/80 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/35">
                      <span className="font-mono text-sm font-medium text-cyan-400">
                        {stage.step}
                      </span>
                      <div>
                        <h3 className="text-lg font-medium text-white">{stage.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">
                          {stage.description}
                        </p>
                      </div>
                    </li>
                  </ScrollReveal>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION D: BUSINESS INTELLIGENCE — "Understand What Your Customers Are Asking."
         ===================================================================== */}
      <section className="relative border-t border-cyan-300/10 bg-[#050E13] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Understand What Your Customers Are Asking.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
              Every metric in HARMEK comes directly from real database records — never invented
              benchmarks or inflated projections. See what customers need and where your
              knowledge can grow.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {BI_SIGNALS.map((sig, idx) => {
              const Icon = sig.icon;
              return (
                <ScrollReveal key={sig.label} delayMs={idx * 60}>
                  <div className="border-t border-cyan-300/20 pt-6 transition-colors duration-300 hover:border-cyan-300/50">
                    <div className="flex items-center gap-2.5 text-cyan-300">
                      <Icon className="h-4 w-4" />
                      <h3 className="text-base font-semibold text-white">{sig.label}</h3>
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-300/90">
                      {sig.detail}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION E: FINAL CTA — "Let Every Conversation Take You Further."
         ===================================================================== */}
      <section className="relative overflow-hidden border-t border-cyan-300/15 bg-[#040B0F] py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.16)_0%,rgba(5,12,16,0.92)_68%)]" />
        <ScrollReveal className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Let Every Conversation Take You Further.
          </h2>
          <p className="mt-5 text-base text-slate-300 sm:text-lg">
            Discover a smarter way to manage customer communication.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              href="/get-started"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-7 text-sm font-semibold text-[#041318] transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-300 shadow-[0_8px_32px_rgba(34,211,238,0.28)]"
            >
              Start Your 14-Day Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-cyan-200/25 bg-[#06151B]/70 px-6 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/50 hover:bg-[#0A2029]"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            No credit card required. Your 14-day trial begins only when you activate your
            assistant.
          </p>
        </ScrollReveal>
      </section>

      {/* Floating Mascot Chat Widget */}
      <FloatingMascotChat />
    </div>
  );
}
