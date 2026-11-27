import Image from "next/image";
import { cn } from "@/lib/utils";

export type EmberFoxMood = "friendly" | "listening" | "thinking" | "celebrating";

interface EmberFoxProps {
  mood?: EmberFoxMood;
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Official HARMEK AI Mascot avatar component.
 * Renders the uploaded HARMEK AI mascot with subtle mood status indicator.
 */
export function EmberFox({
  mood = "friendly",
  size = 48,
  className,
  label = "HARMEK AI mascot",
}: EmberFoxProps) {
  const dotColor =
    mood === "celebrating"
      ? "bg-emerald-400"
      : mood === "thinking"
        ? "bg-cyan-300 animate-pulse"
        : "bg-cyan-400";

  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-flex shrink-0 select-none overflow-hidden rounded-full border border-cyan-300/35 bg-white shadow-[0_6px_20px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      <Image
        src="/harmek-mascot.jpg"
        alt={label}
        fill
        sizes={`${Math.max(size, 64)}px`}
        className="object-cover object-top"
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#061015]",
          dotColor
        )}
      />
    </span>
  );
}
