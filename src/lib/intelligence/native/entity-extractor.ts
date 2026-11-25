/**
 * Lightweight deterministic entity extractor for the Native Harmek Engine.
 * Extracts customer contact details and numeric quantities without an LLM.
 */

export interface ExtractedEntities {
  email: string | null;
  phone: string | null;
  name: string | null;
  quantity: number | null;
}

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/;
const NAME_INTRO_REGEX =
  /(?:my name is|i am|i'm|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
const QUANTITY_REGEX = /\b(\d{1,3})\s*(?:pcs|pieces|items|bottles|units|sets|packs|boxes)\b/i;

export function extractEntities(message: string): ExtractedEntities {
  const emailMatch = message.match(EMAIL_REGEX);
  const phoneMatch = message.match(PHONE_REGEX);
  const nameMatch = message.match(NAME_INTRO_REGEX);
  const qtyMatch = message.match(QUANTITY_REGEX);

  let name: string | null = null;
  if (nameMatch?.[1]) {
    const candidate = nameMatch[1].trim();
    const blockedWords = new Set([
      "looking", "asking", "interested", "calling", "trying", "having",
      "not", "here", "ready", "happy", "upset", "frustrated", "sure",
    ]);
    const firstWord = candidate.split(/\s+/)[0]?.toLowerCase() ?? "";
    if (!blockedWords.has(firstWord)) {
      name = candidate
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }
  }

  return {
    email: emailMatch ? emailMatch[0].toLowerCase() : null,
    phone: phoneMatch ? phoneMatch[0].trim() : null,
    name,
    quantity: qtyMatch ? Number.parseInt(qtyMatch[1], 10) : null,
  };
}
