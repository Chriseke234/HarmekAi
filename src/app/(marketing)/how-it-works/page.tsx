import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    title: "Create your business workspace",
    description:
      "Sign up with your email and describe your business — industry, operating hours, contact details, delivery details, and booking rules.",
  },
  {
    title: "Add your products, services, and FAQs",
    description:
      "Enter structured pricing, service descriptions, FAQs, and policies in plain language. No technical prompt writing or vector database setup required.",
  },
  {
    title: "Choose tone, boundaries, and test live",
    description:
      "Pick a personality preset (Friendly, Professional, Luxury, Supportive, Conversational, or Custom), define avoided topics, and test real customer questions in the built-in simulator.",
  },
  {
    title: "Activate Sage and embed on your website",
    description:
      "Activate your assistant to start your 14-day free trial, paste one lightweight script tag onto your website, and manage live conversations or take over as a human anytime.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-normal text-[#F5F2EB] sm:text-5xl">
          From setup to live customer assistant in four steps.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#B5AEA2]">
          Guided in plain language so any business owner can launch Harmek without technical
          support.
        </p>
      </div>

      <ol className="mt-14 divide-y divide-[#2B2722] border-y border-[#2B2722]">
        {STEPS.map((item, index) => (
          <li key={item.title} className="grid gap-4 py-8 sm:grid-cols-12">
            <div className="sm:col-span-2">
              <span className="font-mono text-sm text-[#D97745]">Step {index + 1}</span>
            </div>
            <div className="sm:col-span-10">
              <h2 className="font-display text-2xl font-normal text-[#F5F2EB]">
                {item.title}
              </h2>
              <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[#B5AEA2]">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#2B2722] bg-[#181613] p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5 text-sm text-[#B5AEA2]">
          <Check className="h-4 w-4 text-[#84A98C]" />
          Your 14-day trial begins only at Step 4 when you activate Harmek.
        </div>
        <Link href="/get-started">
          <Button>
            Start Setup Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
