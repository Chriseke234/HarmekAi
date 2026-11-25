import Link from "next/link";
import { Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "For solo founders and small businesses getting started.",
    highlight: false,
    features: [
      "Native Harmek Intelligence Engine included",
      "Up to 1,000 conversations / month",
      "Website chat widget with custom branding",
      "Unified inbox & human takeover",
      "Structured Products, Services & FAQs",
      "2 team members",
    ],
  },
  {
    name: "Growth",
    price: "$79",
    period: "/month",
    description: "For growing businesses managing higher enquiry volume.",
    highlight: true,
    features: [
      "Everything in Starter",
      "Up to 5,000 conversations / month",
      "Optional Enhanced AI (BYO key or managed)",
      "Guided automations & execution logs",
      "Knowledge gap reporting & analytics",
      "Up to 10 team members",
    ],
  },
  {
    name: "Scale",
    price: "$199",
    period: "/month",
    description: "For multi-agent teams needing higher limits and priority support.",
    highlight: false,
    features: [
      "Everything in Growth",
      "Up to 25,000 conversations / month",
      "Unlimited knowledge sources",
      "Webhooks & API access",
      "Role-based permissions & audit logs",
      "Unlimited team members",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl font-normal text-[#F5F2EB] sm:text-5xl">
          Transparent pricing, backed by a genuine 14-day trial.
        </h1>
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[#B5AEA2]">
          No credit card required. Your 14-day free trial starts only when you activate your
          assistant — and concludes with a real Trial Performance Report before you decide.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col justify-between rounded-xl border p-7 ${
              plan.highlight
                ? "border-[#D97745] bg-[#1C1915]"
                : "border-[#2B2722] bg-[#181613]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-normal text-[#F5F2EB]">
                  {plan.name}
                </h2>
                {plan.highlight ? (
                  <span className="font-mono text-xs text-[#D97745]">Recommended</span>
                ) : null}
              </div>
              <p className="mt-1.5 text-sm text-[#B5AEA2]">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1 border-b border-[#2B2722] pb-6">
                <span className="font-display text-4xl font-medium tabular-nums text-[#F5F2EB]">
                  {plan.price}
                </span>
                <span className="text-sm text-[#968E82]">{plan.period}</span>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-[#B5AEA2]">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#84A98C]" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/get-started" className="mt-8 block">
              <Button
                variant={plan.highlight ? "default" : "secondary"}
                className="w-full"
              >
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-[#2B2722] bg-[#181613] p-6">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#84A98C]" />
          <div>
            <h3 className="text-sm font-semibold text-[#F5F2EB]">
              Fair Post-Trial Data Retention Policy
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[#B5AEA2]">
              We never silently delete your business data when a trial ends. If your 14-day
              trial expires without upgrading, automated replies pause while your knowledge
              base, contacts, conversation history, and Trial Performance Report remain safely
              accessible so you can review results and upgrade whenever ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
