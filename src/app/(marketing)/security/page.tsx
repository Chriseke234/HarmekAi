import Link from "next/link";
import { Check, KeyRound, Lock, ShieldCheck, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Security & Multi-Tenant Trust",
  description:
    "How Harmek AI isolates workspaces, encrypts optional API keys, and protects customer conversations.",
};

const PILLARS = [
  {
    icon: Lock,
    title: "Database-Enforced Multi-Tenant Isolation",
    body: "Every tenant-owned table in Supabase PostgreSQL is scoped by workspace_id and protected by Row Level Security (RLS) policies plus server-side role verification (Owner, Administrator, Agent). We never rely solely on frontend filtering.",
  },
  {
    icon: KeyRound,
    title: "AES-256-GCM Encrypted Credential Storage",
    body: "Optional Enhanced AI provider keys (OpenAI, Anthropic, Gemini) are encrypted server-side with AES-256-GCM in a restricted table (`workspace_ai_credentials`) that blocks all browser and client reads. No private keys ever ship to the website widget.",
  },
  {
    icon: ShieldCheck,
    title: "Zero-LLM Default & Anti-Hallucination Guardrails",
    body: "Harmek's Native Intelligence Engine runs without sending customer data to third-party LLMs. Both Native and Enhanced modes include prompt-injection filtering, avoided-topic guardrails, and a post-generation price fact verifier.",
  },
  {
    icon: Server,
    title: "Hardened Webhooks, Imports & Human Control",
    body: "WhatsApp Cloud API webhooks verify HMAC-SHA256 `X-Hub-Signature-256` headers; website URL imports enforce strict SSRF protection against private networks; and Human Takeover enforces a server-side AI pause lock until control is returned.",
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl font-normal text-[#F5F2EB] sm:text-5xl">
          Security built into every workspace from day one.
        </h1>
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[#B5AEA2]">
          Harmek AI is architected for real businesses that need strict tenant isolation,
          predictable AI guardrails, and transparent data practices.
        </p>
      </div>

      <div className="mt-14 divide-y divide-[#2B2722] border-y border-[#2B2722]">
        {PILLARS.map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.title} className="grid gap-4 py-8 sm:grid-cols-12">
              <div className="flex items-start gap-3 sm:col-span-5">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-[#D97745]" />
                <h2 className="font-display text-2xl font-normal text-[#F5F2EB]">
                  {item.title}
                </h2>
              </div>
              <div className="sm:col-span-7">
                <p className="text-sm leading-relaxed text-[#B5AEA2]">{item.body}</p>
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#2B2722] bg-[#181613] p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5 text-sm text-[#B5AEA2]">
          <Check className="h-4 w-4 text-[#84A98C]" />
          Security enquiries or responsible disclosure:{" "}
          <a href="mailto:ai.harmek.build@gmail.com" className="text-[#F5F2EB] underline">
            ai.harmek.build@gmail.com
          </a>
        </div>
        <Link href="/contact">
          <Button variant="secondary">Contact Support</Button>
        </Link>
      </div>
    </div>
  );
}
