"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HarmekLogo } from "@/components/brand/harmek-logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/industries", label: "Industries" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#2B2722] bg-[#11100E]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <HarmekLogo className="h-8 w-8" />
          <span className="font-display text-xl font-medium tracking-tight text-[#F5F2EB]">
            Harmek AI
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-[#F5F2EB] bg-[#211E1A]"
                  : "text-[#B5AEA2] hover:text-[#F5F2EB]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/get-started">
            <Button size="sm">Start 14-Day Trial</Button>
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#B5AEA2] hover:bg-[#211E1A] hover:text-[#F5F2EB] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[#2B2722] bg-[#181613] px-4 py-4 md:hidden">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname === link.href
                    ? "bg-[#211E1A] text-[#F5F2EB]"
                    : "text-[#B5AEA2] hover:bg-[#211E1A]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-[#2B2722] pt-4">
              <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/get-started" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Start 14-Day Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
