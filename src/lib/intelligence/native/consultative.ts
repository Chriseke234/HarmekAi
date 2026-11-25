import type {
  KnowledgeMatchCandidate,
  WorkspaceKnowledgeBundle,
} from "./knowledge-matcher";
import { formatCurrency } from "@/lib/utils";

export interface DetectedChallenge {
  rawPhrase: string;
  theme:
    | "quality_or_result"
    | "time_or_convenience"
    | "price_or_value"
    | "selection_uncertainty"
    | "general_problem";
}

const CHALLENGE_PATTERNS: Array<{
  theme: DetectedChallenge["theme"];
  pattern: RegExp;
}> = [
  {
    theme: "time_or_convenience",
    pattern:
      /\b(no time|too busy|running late|takes too long|slow|urgent|quickly|fast turnaround|busy schedule|dont have time|don't have time)\b/i,
  },
  {
    theme: "price_or_value",
    pattern:
      /\b(too expensive|overpriced|tight budget|worth it|save money|affordable|not sure if it's worth|cost too much)\b/i,
  },
  {
    theme: "selection_uncertainty",
    pattern:
      /\b(not sure which|confused|overwhelmed|don't know what|dont know which|hard to choose|first time buying|new to this)\b/i,
  },
  {
    theme: "quality_or_result",
    pattern:
      /\b(struggling with|problem with|issue with|trouble with|suffering from|dealing with|trying to fix|want to improve|feels dry|dull skin|acne|stains|wrinkles|damaged|not working|keeps breaking)\b/i,
  },
  {
    theme: "general_problem",
    pattern:
      /\b(my problem is|challenge is|need help fixing|frustrated with|tired of|worried about)\b/i,
  },
];

/**
 * Detects whether a customer is expressing a pain point, struggle, or unmet goal.
 */
export function detectCustomerChallenge(message: string): DetectedChallenge | null {
  const clean = message.trim();
  for (const rule of CHALLENGE_PATTERNS) {
    const match = clean.match(rule.pattern);
    if (match) {
      return {
        rawPhrase: match[0],
        theme: rule.theme,
      };
    }
  }
  return null;
}

/**
 * Active listening: reflects the customer's stated challenge back concisely and empathetically.
 */
export function buildActiveListeningReflection(challenge: DetectedChallenge): string {
  switch (challenge.theme) {
    case "time_or_convenience":
      return `I hear you — saving time and keeping things effortless is a real priority when "${challenge.rawPhrase}" is getting in the way.`;
    case "price_or_value":
      return `That makes complete sense — getting clear, reliable value for your budget matters.`;
    case "selection_uncertainty":
      return `It is completely normal to feel unsure when comparing options — let us narrow it down together step by step.`;
    case "quality_or_result":
      return `I understand how frustrating dealing with "${challenge.rawPhrase}" can be, and I want to point you to something that genuinely fits.`;
    default:
      return `Thanks for sharing that — understanding your exact situation helps me point you to the right solution.`;
  }
}

/**
 * Generates one insightful, plain-language discovery question tailored to the challenge theme
 * and business industry so Harmek uncovers real needs before pitching.
 */
export function buildInsightfulDiscoveryQuestion(
  challenge: DetectedChallenge,
  industry?: string | null
): string {
  switch (challenge.theme) {
    case "time_or_convenience":
      return "When do you ideally need this completed or delivered, and how often do you run into this?";
    case "price_or_value":
      return "Do you have a comfortable budget range in mind, and which outcome matters most to you?";
    case "selection_uncertainty":
      return industry && industry !== "General"
        ? `To recommend the best fit from our ${industry} catalog, what is the main result you are hoping for?`
        : "What is the main result or goal you are hoping to achieve?";
    case "quality_or_result":
      return "Have you tried anything for this before, and is there anything specific you want to avoid or prioritize?";
    default:
      return "Could you share a little more about the outcome you are hoping for and your ideal timeline?";
  }
}

/**
 * Connects a customer's stated challenge to verified catalog items and explains concrete value
 * strictly grounded in the business's real descriptions and prices.
 */
export function connectChallengeToVerifiedValue(
  challenge: DetectedChallenge,
  matches: KnowledgeMatchCandidate[],
  knowledge: WorkspaceKnowledgeBundle
): string {
  const businessName = knowledge.businessProfile?.business_name ?? "our team";
  const reflection = buildActiveListeningReflection(challenge);

  const catalogMatches = matches
    .filter((m) => m.type === "product" || m.type === "service")
    .slice(0, 2);

  if (catalogMatches.length > 0) {
    const valueLines = catalogMatches.map((m) => {
      const price =
        m.product?.price ?? m.service?.price ?? null;
      const currency =
        m.product?.currency ?? m.service?.currency ?? "USD";
      const desc = (m.product?.description || m.service?.description || "").trim();
      const priceLabel = price !== null ? ` (${formatCurrency(price, currency)})` : "";
      return `• ${m.title}${priceLabel}${desc ? ` — ${desc}` : ""}`;
    });

    const deliveryNote =
      challenge.theme === "time_or_convenience" &&
      knowledge.businessProfile?.delivery_info?.trim()
        ? `\n\nFor convenience: ${knowledge.businessProfile.delivery_info.trim()}`
        : "";

    const discoveryQ = buildInsightfulDiscoveryQuestion(
      challenge,
      knowledge.businessProfile?.industry
    );

    return `${reflection}\n\nBased on what you shared, here is how ${businessName} can help:\n${valueLines.join(
      "\n"
    )}${deliveryNote}\n\n${discoveryQ}`;
  }

  const discoveryQ = buildInsightfulDiscoveryQuestion(
    challenge,
    knowledge.businessProfile?.industry
  );
  return `${reflection} ${discoveryQ}`;
}

export interface InterpretedBusinessInsight {
  theme: string;
  mentions: number;
  businessOutcomeRecommendation: string;
  sampleCustomerQuote: string;
}

/**
 * Interprets real recorded customer messages to uncover recurring customer challenges
 * and connect them directly to actionable business-growth outcomes in Analytics.
 */
export function interpretCustomerChallenges(
  customerMessages: Array<{ content: string }>
): InterpretedBusinessInsight[] {
  const buckets = new Map<
    DetectedChallenge["theme"],
    { count: number; sampleQuote: string }
  >();

  for (const msg of customerMessages) {
    const detected = detectCustomerChallenge(msg.content);
    if (!detected) continue;
    const existing = buckets.get(detected.theme);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(detected.theme, {
        count: 1,
        sampleQuote: msg.content.trim().slice(0, 140),
      });
    }
  }

  const meta: Record<
    DetectedChallenge["theme"],
    { label: string; recommendation: string }
  > = {
    time_or_convenience: {
      label: "Speed & Convenience Friction",
      recommendation:
        "Highlight express turnaround or same-day delivery clearly in your Business Profile and starter quick-reply chips to convert time-sensitive buyers.",
    },
    price_or_value: {
      label: "Price & Value Hesitation",
      recommendation:
        "Add bundle options or clear value descriptions to your Products/Services so Harmek can justify value and offer affordable alternatives automatically.",
    },
    selection_uncertainty: {
      label: "Choice Uncertainty",
      recommendation:
        "Enrich product descriptions with who each item is best for so Harmek's guided recommendation flow converts undecided shoppers faster.",
    },
    quality_or_result: {
      label: "Specific Outcome / Problem Relief",
      recommendation:
        "Pair your top problem-solving products with FAQ proof points so Harmek connects customer pain points directly to verified catalog items.",
    },
    general_problem: {
      label: "General Support & Troubleshooting",
      recommendation:
        "Review these threads in Conversations and approve verified human answers into your Knowledge Base via the Self-Healing FAQ loop.",
    },
  };

  return Array.from(buckets.entries())
    .map(([theme, data]) => ({
      theme: meta[theme].label,
      mentions: data.count,
      businessOutcomeRecommendation: meta[theme].recommendation,
      sampleCustomerQuote: data.sampleQuote,
    }))
    .sort((a, b) => b.mentions - a.mentions);
}
