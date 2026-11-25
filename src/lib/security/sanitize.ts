/**
 * Input sanitization and prompt-injection defense utilities.
 * Protects both the Native Harmek Engine and Optional Enhanced AI layer
 * from adversarial customer messages or untrusted uploaded text.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|prompts)/i,
  /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|rules)/i,
  /reveal\s+(your\s+)?(system\s+prompt|hidden\s+instructions|api\s+key)/i,
  /you\s+are\s+now\s+(a\s+)?(dan|jailbroken|unrestricted|developer\s+mode)/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+(rules|restrictions|limits)/i,
  /override\s+(system|business)\s+(policy|rules|prices)/i,
  /<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/i,
];

/**
 * Strips dangerous control characters and script tags while preserving normal punctuation.
 */
export function sanitizeUserText(input: string, maxLength = 4000): string {
  return input
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Detects common prompt-injection or policy-override attempts.
 */
export function detectPromptInjection(input: string): boolean {
  const normalized = input.trim();
  return INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Checks whether a customer message touches any workspace-configured avoided topic.
 */
export function detectAvoidedTopic(
  input: string,
  avoidedTopics: string[]
): string | null {
  if (!avoidedTopics || avoidedTopics.length === 0) return null;
  const lower = input.toLowerCase();
  for (const rawTopic of avoidedTopics) {
    const topic = rawTopic.trim().toLowerCase();
    if (!topic) continue;
    if (lower.includes(topic)) {
      return rawTopic.trim();
    }
  }
  return null;
}
