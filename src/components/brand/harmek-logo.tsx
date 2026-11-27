import Image from "next/image";
import { cn } from "@/lib/utils";

interface HarmekLogoProps {
  className?: string;
}

/**
 * Official Harmek AI logo icon mark.
 */
export function HarmekLogo({ className }: HarmekLogoProps) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-[#262626] bg-white",
        className
      )}
    >
      <Image
        src="/harmek-logo.png"
        alt="Harmek AI logo"
        fill
        sizes="40px"
        className="object-cover"
        priority
      />
    </span>
  );
}
