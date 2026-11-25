import { cn } from "@/lib/utils";

interface HarmekLogoProps {
  className?: string;
}

/**
 * Bespoke geometric monogram icon for Harmek AI.
 * Architectural "H" arches with a subtle burnished-copper conversational spark.
 */
export function HarmekLogo({ className }: HarmekLogoProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0", className)}
    >
      <rect
        x="1"
        y="1"
        width="34"
        height="34"
        rx="9"
        fill="#181613"
        stroke="#3D3730"
        strokeWidth="1.5"
      />
      {/* Left pillar */}
      <path
        d="M11 10V26"
        stroke="#F5F2EB"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Right pillar */}
      <path
        d="M25 10V26"
        stroke="#F5F2EB"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Burnished Copper architectural crossbar + center spark */}
      <path
        d="M11 18H25"
        stroke="#D97745"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="18" cy="18" r="2.2" fill="#F5F2EB" />
      <circle cx="25" cy="10" r="1.8" fill="#D97745" />
    </svg>
  );
}
