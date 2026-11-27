import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const INDUSTRIES = [
  {
    name: "Skincare & Beauty Brands",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    examples:
      "Answer product ingredient questions, share verified prices and availability, explain delivery timelines, and escalate skin-sensitivity questions to your team.",
  },
  {
    name: "E-Commerce & Retail",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
    examples:
      "Handle product catalog lookups, shipping costs, return policies, and store locations while capturing buyer contact details.",
  },
  {
    name: "Laundry & Cleaning Services",
    image:
      "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=900&q=80",
    examples:
      "Share per-item or package pricing, pickup and delivery schedules, turnaround times, and route special garment requests to staff.",
  },
  {
    name: "Salons & Wellness",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
    examples:
      "Explain treatment menus, session durations, booking requirements, cancellation policies, and capture appointment enquiries.",
  },
  {
    name: "Hospitality & Food",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    examples:
      "Provide opening hours, location directions, reservation policies, and group enquiry routing to your front desk.",
  },
  {
    name: "Professional Services",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
    examples:
      "Outline consultation services, fee structures, office hours, and qualify prospective client enquiries for human follow-up.",
  },
];

export default function IndustriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl font-normal text-[#FAFAFA] sm:text-5xl">
          Built to adapt across customer-facing industries.
        </h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[#A3A3A3]">
          Harmek AI learns your catalog, policies, and tone without forcing your business into a
          single rigid template.
        </p>
      </div>

      <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((ind) => (
          <article
            key={ind.name}
            className="overflow-hidden rounded-xl border border-[#262626] bg-[#121212]"
          >
            <div className="relative h-48 w-full">
              <Image src={ind.image} alt={ind.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
            </div>
            <div className="p-6">
              <h2 className="font-display text-xl font-normal text-[#FAFAFA]">{ind.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#A3A3A3]">{ind.examples}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Link href="/get-started">
          <Button size="lg">
            Configure Harmek for Your Business
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
