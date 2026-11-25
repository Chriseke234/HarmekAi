import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "How Harmek AI (operated by ChrisBuilds) collects, isolates, and protects data.",
};

const SECTIONS = [
  {
    title: "1. Who We Are",
    body: "Harmek AI is operated by ChrisBuilds. For privacy enquiries or data deletion requests, contact us at harmekai@gmail.com.",
  },
  {
    title: "2. Information We Collect",
    body: "For business owners and team members, we collect account credentials, full name, email address, and the business profile and knowledge items you choose to upload. For end-customers interacting through an embedded Harmek AI chat widget or connected channel, we store conversation messages and only the contact details (name, email, phone) that the customer voluntarily provides.",
  },
  {
    title: "3. Data Minimization & Consent",
    body: "Harmek AI does not collect unnecessary personal information or run third-party advertising trackers. Persistent visitor chat history in the website widget is consent-gated — visitors may always choose 'Continue Without Saving' for an ephemeral session.",
  },
  {
    title: "4. Zero-LLM Default & Optional Enhanced AI",
    body: "By default, Harmek AI runs its Native Intelligence Engine directly on your structured workspace database without sending customer messages to external LLM providers. If a business explicitly enables Optional Enhanced AI (OpenAI, Anthropic, or Google Gemini), customer messages and relevant catalog context are transmitted server-side to the selected provider solely to generate a reply. API keys are encrypted at rest with AES-256-GCM and never exposed in browser code.",
  },
  {
    title: "5. Multi-Tenant Data Isolation",
    body: "Every business workspace is strictly isolated using PostgreSQL Row Level Security (RLS) scoped by workspace_id. One business can never view, search, or modify another business's contacts, conversations, knowledge base, or analytics.",
  },
  {
    title: "6. Data Retention & Deletion",
    body: "We retain workspace data while your account is active and preserve it in read-only mode if a 14-day trial expires so you never lose business records unexpectedly. Workspace Owners may delete knowledge items or request full workspace deletion at any time by emailing harmekai@gmail.com.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-normal text-[#F5F2EB] sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#B5AEA2]">
          How Harmek AI (operated by ChrisBuilds) protects business workspaces and end-customer
          conversations.
        </p>
        <p className="mt-2 font-mono text-xs text-[#968E82]">
          Last Updated: November 25, 2026
        </p>
      </div>

      <div className="mt-12 divide-y divide-[#2B2722] border-y border-[#2B2722]">
        {SECTIONS.map((s) => (
          <section key={s.title} className="py-7">
            <h2 className="font-display text-2xl font-normal text-[#F5F2EB]">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#B5AEA2]">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-[#968E82]">
        Questions or deletion requests? Email{" "}
        <a href="mailto:harmekai@gmail.com" className="text-[#D97745] hover:underline">
          harmekai@gmail.com
        </a>{" "}
        or visit{" "}
        <Link href="/contact" className="text-[#D97745] hover:underline">
          Contact &amp; Support
        </Link>
        .
      </p>
    </div>
  );
}
