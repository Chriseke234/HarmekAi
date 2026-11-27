import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Cookies Policy",
  description:
    "How Harmek AI uses strictly necessary session cookies and consent-based widget storage.",
};

const COOKIE_CATEGORIES = [
  {
    name: "Strictly Necessary Authentication Cookies",
    purpose:
      "Issued by Supabase Auth (`sb-*-auth-token`) when you sign in to your Harmek AI business workspace. These cookies keep your session authenticated, enforce multi-tenant workspace isolation, and protect against unauthorized access.",
    duration: "Session / Refresh token lifetime (cleared immediately on Sign Out)",
    optional: "Required for authenticated dashboard use",
  },
  {
    name: "Website Chat Widget Persistence Storage (Consent-Gated)",
    purpose:
      "When a visitor opens an embedded Harmek AI chat widget on a customer website, Harmek asks whether the visitor wants their chat remembered. Only if the visitor explicitly clicks 'Remember My Chat' does Harmek store a random anonymous visitor token in browser `localStorage` (`sage_visitor_<widgetKey>`) so they can resume their conversation later.",
    duration: "Persists until cleared by the visitor (never set if 'Continue Without Saving' is chosen)",
    optional: "Strictly opt-in by the website visitor",
  },
  {
    name: "Advertising & Third-Party Tracking Cookies",
    purpose:
      "Harmek AI does NOT place third-party advertising cookies, cross-site tracking pixels, or data-broker scripts on the marketing site, business dashboard, or embedded website chat widget.",
    duration: "None",
    optional: "Not used",
  },
];

export default function CookiesPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-normal text-[#FAFAFA] sm:text-5xl">
          Cookies &amp; Local Storage Policy
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#A3A3A3]">
          Harmek AI is built on data minimization. We use only the cookies and local storage
          entries required to operate secure workspaces and consent-based customer chat.
        </p>
        <p className="mt-2 font-mono text-xs text-[#8F8F8F]">
          Effective Date: November 25, 2026
        </p>
      </div>

      <div className="mt-12 divide-y divide-[#262626] border-y border-[#262626]">
        {COOKIE_CATEGORIES.map((cat) => (
          <section key={cat.name} className="py-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl font-normal text-[#FAFAFA]">{cat.name}</h2>
              <span className="font-mono text-xs text-[#D4D4D4]">{cat.optional}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#A3A3A3]">{cat.purpose}</p>
            <p className="mt-2.5 text-xs text-[#8F8F8F]">
              <strong className="text-[#D4D4D4]">Retention:</strong> {cat.duration}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-[#262626] bg-[#121212] p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#FFFFFF]" />
          <div className="text-sm leading-relaxed text-[#A3A3A3]">
            <p className="font-semibold text-[#FAFAFA]">Managing Your Preferences</p>
            <p className="mt-1">
              Business owners can enforce explicit visitor consent inside{" "}
              <Link href="/dashboard/integrations" className="text-[#FFFFFF] hover:underline">
                Dashboard &rarr; Integrations
              </Link>
              . Visitors may clear their browser storage at any time or select &ldquo;Continue
              Without Saving&rdquo; in any Harmek AI chat widget for an ephemeral session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
