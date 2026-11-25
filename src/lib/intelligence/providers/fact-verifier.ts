import type { WorkspaceKnowledgeBundle } from "../native/knowledge-matcher";

export interface FactVerificationResult {
  verified: boolean;
  violations: string[];
}

/**
 * Post-Generation Fact Verifier for Optional Enhanced AI replies.
 * Extracts any explicit currency prices mentioned in an LLM's generated response
 * and verifies that each price exists in the workspace's structured catalog or FAQs.
 * Prevents LLM price hallucinations by triggering automatic fallback to the Native Engine.
 */
export function verifyEnhancedReplyFacts(
  reply: string,
  knowledge: WorkspaceKnowledgeBundle
): FactVerificationResult {
  const violations: string[] = [];

  // Extract explicit currency amounts like $38, $38.00, ₦5,000, £19.99, €25
  const priceMatches = reply.match(/(?:[$£€₦]|USD|NGN|GBP|EUR)\s?\d[\d,]*(?:\.\d{1,2})?/gi) ?? [];

  if (priceMatches.length === 0) {
    return { verified: true, violations: [] };
  }

  // Collect all verified numeric prices from products, services, FAQs, and knowledge sources
  const verifiedNumbers = new Set<number>();

  for (const p of knowledge.products) {
    if (p.is_active && typeof p.price === "number") verifiedNumbers.add(Number(p.price.toFixed(2)));
  }
  for (const s of knowledge.services) {
    if (s.is_active && typeof s.price === "number") verifiedNumbers.add(Number(s.price.toFixed(2)));
  }

  const textCorpus = [
    ...knowledge.faqs.filter((f) => f.is_active).map((f) => f.answer),
    ...knowledge.knowledgeSources.filter((k) => k.status === "indexed").map((k) => k.content),
    knowledge.businessProfile?.delivery_info ?? "",
    knowledge.businessProfile?.booking_info ?? "",
    knowledge.businessProfile?.return_policy ?? "",
  ].join(" ");

  const corpusNums = textCorpus.match(/\d[\d,]*(?:\.\d{1,2})?/g) ?? [];
  for (const raw of corpusNums) {
    const parsed = Number.parseFloat(raw.replace(/,/g, ""));
    if (!Number.isNaN(parsed)) verifiedNumbers.add(Number(parsed.toFixed(2)));
  }

  for (const rawPrice of priceMatches) {
    const numericPart = rawPrice.replace(/[^0-9.]/g, "");
    const val = Number.parseFloat(numericPart);
    if (!Number.isNaN(val) && !verifiedNumbers.has(Number(val.toFixed(2)))) {
      violations.push(`Unverified price figure "${rawPrice}" not found in workspace knowledge.`);
    }
  }

  return {
    verified: violations.length === 0,
    violations,
  };
}
