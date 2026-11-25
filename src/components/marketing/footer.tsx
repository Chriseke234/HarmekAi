import Link from "next/link";
import { HarmekLogo } from "@/components/brand/harmek-logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#2B2722] bg-[#0D0C0A]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <HarmekLogo className="h-8 w-8" />
              <span className="font-display text-xl font-medium text-[#F5F2EB]">Harmek AI</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#B5AEA2]">
              Your business, always within reach. Standalone customer engagement software
              operated by ChrisBuilds.
            </p>
            <p className="mt-3 text-xs text-[#968E82]">
              Support:{" "}
              <a href="mailto:harmekai@gmail.com" className="text-[#D97745] hover:underline">
                harmekai@gmail.com
              </a>
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#968E82]">
              Product
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-sm text-[#B5AEA2]">
              <li>
                <Link href="/features" className="hover:text-[#F5F2EB]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-[#F5F2EB]">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/industries" className="hover:text-[#F5F2EB]">
                  Industries
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#F5F2EB]">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#968E82]">
              Trust &amp; Legal
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-sm text-[#B5AEA2]">
              <li>
                <Link href="/security" className="hover:text-[#F5F2EB]">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#F5F2EB]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#F5F2EB]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-[#F5F2EB]">
                  Cookies Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#F5F2EB]">
                  Contact &amp; Support
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#968E82]">
              Workspace
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-sm text-[#B5AEA2]">
              <li>
                <Link href="/get-started" className="hover:text-[#F5F2EB]">
                  Start 14-Day Trial
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-[#F5F2EB]">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#F5F2EB]">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[#2B2722] pt-6 text-xs text-[#968E82] sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} Harmek AI (operated by ChrisBuilds). All rights reserved.</p>
          <p>14-day free trial starts on assistant activation. No credit card required.</p>
        </div>
      </div>
    </footer>
  );
}
