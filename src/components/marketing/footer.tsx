import Link from "next/link";
import { HarmekLogo } from "@/components/brand/harmek-logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#262626] bg-[#050505]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <HarmekLogo className="h-8 w-8" />
              <span className="font-display text-xl font-medium text-[#FAFAFA]">Harmek AI</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#A3A3A3]">
              Your business, always within reach. Standalone customer engagement software
              operated by ChrisBuilds.
            </p>
            <p className="mt-3 text-xs text-[#8F8F8F]">
              Support:{" "}
              <a href="mailto:ai.harmek.build@gmail.com" className="text-[#FFFFFF] hover:underline">
                ai.harmek.build@gmail.com
              </a>
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8F8F8F]">
              Product
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-sm text-[#A3A3A3]">
              <li>
                <Link href="/features" className="hover:text-[#FAFAFA]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-[#FAFAFA]">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/industries" className="hover:text-[#FAFAFA]">
                  Industries
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#FAFAFA]">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8F8F8F]">
              Trust &amp; Legal
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-sm text-[#A3A3A3]">
              <li>
                <Link href="/security" className="hover:text-[#FAFAFA]">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#FAFAFA]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#FAFAFA]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-[#FAFAFA]">
                  Cookies Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#FAFAFA]">
                  Contact &amp; Support
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8F8F8F]">
              Workspace
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-sm text-[#A3A3A3]">
              <li>
                <Link href="/get-started" className="hover:text-[#FAFAFA]">
                  Start 14-Day Trial
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-[#FAFAFA]">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#FAFAFA]">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[#262626] pt-6 text-xs text-[#8F8F8F] sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} Harmek AI (operated by ChrisBuilds). All rights reserved.</p>
          <p>14-day free trial starts on assistant activation. No credit card required.</p>
        </div>
      </div>
    </footer>
  );
}
