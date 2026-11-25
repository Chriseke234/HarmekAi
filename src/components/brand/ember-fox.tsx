import { cn } from "@/lib/utils";

export type EmberFoxMood = "friendly" | "listening" | "thinking" | "celebrating";

interface EmberFoxProps {
  mood?: EmberFoxMood;
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Harmek AI Mascot — Friendly Ember Fox.
 * Crisp geometric vector character crafted in Burnished Copper (#D97745),
 * Warm Ink (#181613), Warm Parchment (#F5F2EB), and Sage Olive (#84A98C).
 */
export function EmberFox({
  mood = "friendly",
  size = 48,
  className,
  label = "Harmek AI Ember Fox mascot",
}: EmberFoxProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={cn("shrink-0 select-none", className)}
    >
      {/* Warm Ink Circular Medallion Backdrop */}
      <circle cx="32" cy="32" r="30" fill="#181613" stroke="#3D3730" strokeWidth="1.5" />

      {/* Outer Fox Ears (Burnished Copper) */}
      <path
        d="M15 27L19 11L30 21Z"
        fill="#D97745"
        stroke="#11100E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M49 27L45 11L34 21Z"
        fill="#D97745"
        stroke="#11100E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Inner Ear Warm Parchment Cutouts */}
      <path d="M18.5 23.5L20.5 15.5L26.5 21Z" fill="#F5F2EB" fillOpacity="0.88" />
      <path d="M45.5 23.5L43.5 15.5L37.5 21Z" fill="#F5F2EB" fillOpacity="0.88" />

      {/* Geometric Fox Head Silhouette */}
      <path
        d="M14 31C14 23 22 19 32 19C42 19 50 23 50 31C50 41.5 41 49 32 51C23 49 14 41.5 14 31Z"
        fill="#D97745"
      />

      {/* Warm Parchment Cheek Markings */}
      <path
        d="M14.6 33.5C18.5 34.5 24 38.5 27 44.5L32 51C23.5 49 16.5 42.5 14.6 33.5Z"
        fill="#F5F2EB"
      />
      <path
        d="M49.4 33.5C45.5 34.5 40 38.5 37 44.5L32 51C40.5 49 47.5 42.5 49.4 33.5Z"
        fill="#F5F2EB"
      />

      {/* Subtle Forehead Diamond Highlight */}
      <path d="M32 21.5L34.5 25L32 28.5L29.5 25Z" fill="#F0A47A" fillOpacity="0.55" />

      {/* Expressive Eyes by Mood */}
      {mood === "celebrating" ? (
        <>
          <path
            d="M21.5 33.5C22.5 31.3 25.5 31.3 26.5 33.5"
            stroke="#11100E"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M37.5 33.5C38.5 31.3 41.5 31.3 42.5 33.5"
            stroke="#11100E"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      ) : mood === "thinking" ? (
        <>
          <circle cx="24" cy="32.5" r="2.3" fill="#11100E" />
          <circle cx="24.8" cy="31.7" r="0.7" fill="#F5F2EB" />
          <circle cx="40" cy="32.5" r="2.3" fill="#11100E" />
          <circle cx="40.8" cy="31.7" r="0.7" fill="#F5F2EB" />
          {/* Thinking spark */}
          <circle cx="52.5" cy="15.5" r="2.5" fill="#84A98C" />
          <circle cx="56" cy="11" r="1.4" fill="#F0A47A" />
        </>
      ) : (
        <>
          <circle cx="24" cy="33" r="2.4" fill="#11100E" />
          <circle cx="24.9" cy="32.1" r="0.8" fill="#F5F2EB" />
          <circle cx="40" cy="33" r="2.4" fill="#11100E" />
          <circle cx="40.9" cy="32.1" r="0.8" fill="#F5F2EB" />
        </>
      )}

      {/* Nose & Friendly Smile */}
      <path d="M29.5 39.5H34.5L32 42.5Z" fill="#11100E" />
      <path
        d="M28.5 44C29.8 45.4 34.2 45.4 35.5 44"
        stroke="#11100E"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Mood Badge Accent (Sage Olive Spark on Celebrating / Listening) */}
      {mood === "celebrating" ? (
        <path
          d="M52 14L53.2 17.2L56.5 18.4L53.2 19.6L52 22.8L50.8 19.6L47.5 18.4L50.8 17.2Z"
          fill="#84A98C"
        />
      ) : mood === "listening" ? (
        <circle cx="52" cy="18" r="2.8" fill="#84A98C" stroke="#181613" strokeWidth="1.2" />
      ) : null}
    </svg>
  );
}
