import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Harmek AI, operated by ChrisBuilds.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating a workspace, embedding the Harmek AI chat widget, or accessing the Harmek AI platform (operated by ChrisBuilds), you agree to these Terms of Service on behalf of yourself and the business you represent.",
  },
  {
    title: "2. Account & Multi-Tenant Workspaces",
    body: "You are responsible for maintaining the confidentiality of your login credentials and for all actions taken within your business workspace. Workspace Owners control team memberships and role permissions (Owner, Administrator, Agent). You may not attempt to access another business's workspace or data.",
  },
  {
    title: "3. 14-Day Free Trial & Billing",
    body: "Harmek AI offers a 14-day free trial with no credit card required to begin. The 14-day trial clock starts when you activate your assistant, not merely upon registration. If your trial expires without selecting a paid plan, automated customer replies pause while your business knowledge, contacts, conversations, and Trial Performance Report remain safely preserved and readable — we do not silently delete your data upon expiration.",
  },
  {
    title: "4. Business Responsibility for Knowledge & Policies",
    body: "Harmek AI grounds its answers in the products, services, prices, FAQs, policies, and documents you supply. You are solely responsible for ensuring that your pricing, availability, policies, and customer communications are accurate and lawful. When using optional third-party Enhanced AI providers (such as OpenAI, Anthropic, or Google Gemini) with your own API key, your usage is also subject to that provider's terms.",
  },
  {
    title: "5. Acceptable Use & Official Channels",
    body: "You agree not to use Harmek AI for spam, deceptive impersonation, illegal activity, or unauthorized scraping. Messaging integrations (including WhatsApp Business Platform, Instagram Messaging API, and Facebook Messenger) must only be connected using official platform credentials and with appropriate customer consent.",
  },
  {
    title: "6. Service Availability & Limitation of Liability",
    body: "We work to keep Harmek AI reliable and available, but the service is provided on an 'as is' and 'as available' basis. To the maximum extent permitted by law, Harmek AI (operated by ChrisBuilds) is not liable for indirect, incidental, or consequential damages arising from your use of the platform.",
  },
  {
    title: "7. Contact",
    body: "Questions about these Terms of Service may be sent to ai.harmek.build@gmail.com or submitted through our Contact & Support page.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-normal text-[#F5F2EB] sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#B5AEA2]">
          Clear, plain-language terms governing your use of Harmek AI (operated by ChrisBuilds).
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
        See also our{" "}
        <Link href="/privacy" className="text-[#D97745] hover:underline">
          Privacy Policy
        </Link>
        ,{" "}
        <Link href="/cookies" className="text-[#D97745] hover:underline">
          Cookies Policy
        </Link>
        , and{" "}
        <Link href="/security" className="text-[#D97745] hover:underline">
          Security Overview
        </Link>
        .
      </p>
    </div>
  );
}
