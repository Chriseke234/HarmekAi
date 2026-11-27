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
 * Crisp geometric vector character crafted in Burnished Copper (#FFFFFF),
 * Warm Ink (#121212), Warm Parchment (#FAFAFA), and Sage Olive (#D4D4D4).
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
      <circle cx="32" cy="32" r="30" fill="#121212" stroke="#383838" strokeWidth="1.5" />

      {/* Outer Fox Ears (Burnished Copper) */}
      <path
        d="M15 27L19 11L30 21Z"
        fill="#FFFFFF"
        stroke="#0A0A0A"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M49 27L45 11L34 21Z"
        fill="#FFFFFF"
        stroke="#0A0A0A"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Inner Ear Warm Parchment Cutouts */}
      <path d="M18.5 23.5L20.5 15.5L26.5 21Z" fill="#FAFAFA" fillOpacity="0.88" />
      <path d="M45.5 23.5L43.5 15.5L37.5 21Z" fill="#FAFAFA" fillOpacity="0.88" />

      {/* Geometric Fox Head Silhouette */}
      <path
        d="M14 31C14 23 22 19 32 19C42 19 50 23 50 31C50 41.5 41 49 32 51C23 49 14 41.5 14 31Z"
        fill="#FFFFFF"
      />

      {/* Warm Parchment Cheek Markings */}
      <path
        d="M14.6 33.5C18.5 34.5 24 38.5 27 44.5L32 51C23.5 49 16.5 42.5 14.6 33.5Z"
        fill="#FAFAFA"
      />
      <path
        d="M49.4 33.5C45.5 34.5 40 38.5 37 44.5L32 51C40.5 49 47.5 42.5 49.4 33.5Z"
        fill="#FAFAFA"
      />

      {/* Subtle Forehead Diamond Highlight */}
      <path d="M32 21.5L34.5 25L32 28.5L29.5 25Z" fill="#E5E5E5" fillOpacity="0.55" />

      {/* Expressive Eyes by Mood */}
      {mood === "celebrating" ? (
        <>
          <path
            d="M21.5 33.5C22.5 31.3 25.5 31.3 26.5 33.5"
            stroke="#0A0A0A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M37.5 33.5C38.5 31.3 41.5 31.3 42.5 33.5"
            stroke="#0A0A0A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      ) : mood === "thinking" ? (
        <>
          <circle cx="24" cy="32.5" r="2.3" fill="#0A0A0A" />
          <circle cx="24.8" cy="31.7" r="0.7" fill="#FAFAFA" />
          <circle cx="40" cy="32.5" r="2.3" fill="#0A0A0A" />
          <circle cx="40.8" cy="31.7" r="0.7" fill="#FAFAFA" />
          {/* Thinking spark */}
          <circle cx="52.5" cy="15.5" r="2.5" fill="#D4D4D4" />
          <circle cx="56" cy="11" r="1.4" fill="#E5E5E5" />
        </>
      ) : (
        <>
          <circle cx="24" cy="33" r="2.4" fill="#0A0A0A" />
          <circle cx="24.9" cy="32.1" r="0.8" fill="#FAFAFA" />
          <circle cx="40" cy="33" r="2.4" fill="#0A0A0A" />
          <circle cx="40.9" cy="32.1" r="0.8" fill="#FAFAFA" />
        </>
      )}

      {/* Nose & Friendly Smile */}
      <path d="M29.5 39.5H34.5L32 42.5Z" fill="#0A0A0A" />
      <path
        d="M28.5 44C29.8 45.4 34.2 45.4 35.5 44"
        stroke="#0A0A0A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Mood Badge Accent (Sage Olive Spark on Celebrating / Listening) */}
      {mood === "celebrating" ? (
        <path
          d="M52 14L53.2 17.2L56.5 18.4L53.2 19.6L52 22.8L50.8 19.6L47.5 18.4L50.8 17.2Z"
          fill="#D4D4D4"
        />
      ) : mood === "listening" ? (
        <circle cx="52" cy="18" r="2.8" fill="#D4D4D4" stroke="#121212" strokeWidth="1.2" />
      ) : null}
    </svg>
  );
}
