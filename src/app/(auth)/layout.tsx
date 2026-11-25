import Link from "next/link";
import { HarmekLogo } from "@/components/brand/harmek-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#11100E] px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <HarmekLogo className="h-9 w-9" />
        <span className="font-display text-2xl font-medium tracking-tight text-[#F5F2EB]">
          Harmek AI
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
