"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { HarmekLogo } from "@/components/brand/harmek-logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#discover", label: "Discover" },
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/sign-in", label: "Sign In" },
];

export function MarketingNavbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isHome && !scrolled
          ? "border-b border-transparent bg-transparent"
          : isHome
            ? "border-b border-cyan-300/15 bg-[#061015]/85 backdrop-blur-md"
            : "border-b border-[#262626] bg-[#0A0A0A]/92 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <HarmekLogo className="h-8 w-8" />
          <span className="text-base font-semibold tracking-wide text-white">
            HARMEK AI
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-white bg-white/10"
                    : "text-slate-200/85 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/get-started"
            className={cn(
              "ml-3 inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-all",
              isHome
                ? "bg-cyan-400/90 text-[#041318] hover:bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.22)]"
                : "bg-white text-[#0A0A0A] hover:bg-[#E5E5E5]"
            )}
          >
            Get Started
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/10 hover:text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-cyan-300/15 bg-[#061015]/95 px-4 py-4 backdrop-blur-lg md:hidden">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-white/10 pt-3">
              <Link
                href="/get-started"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-full items-center justify-center rounded-lg bg-cyan-400 text-sm font-semibold text-[#041318] hover:bg-cyan-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
