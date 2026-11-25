/**
 * Lexical normalization, tokenization, and fuzzy similarity utilities
 * for the Native Harmek Intelligence Engine (zero external LLM dependency).
 */

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
  "this", "that", "these", "those", "do", "does", "did", "have", "has", "had",
  "can", "could", "will", "would", "should", "may", "might", "to", "of", "in",
  "on", "at", "for", "with", "about", "by", "from", "up", "out", "if", "or",
  "and", "but", "not", "so", "as", "into", "please", "hi", "hello", "hey",
  "tell", "know", "want", "need", "like", "just", "very", "really", "there",
]);

/**
 * Normalizes text to lowercase alphanumeric tokens with punctuation removed.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lightweight English suffix stemmer for common plurals and verb forms.
 */
export function stemToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ing") && token.length > 5) return token.slice(0, -3);
  if (token.endsWith("ed") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("es") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) {
    return token.slice(0, -1);
  }
  return token;
}

/**
 * Extracts meaningful stemmed tokens (filtering stop-words).
 */
export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const raw = normalized.split(" ");
  const filtered = raw
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .map(stemToken);
  return filtered.length > 0 ? filtered : raw.map(stemToken);
}

/**
 * Computes Levenshtein edit distance between two strings (bounded for speed).
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/**
 * Fuzzy token match score (0 to 1). Handles minor customer typos cleanly.
 */
export function fuzzyTokenSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return 0;
  if (a.includes(b) || b.includes(a)) {
    const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
    return Math.max(0.75, ratio);
  }
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  const similarity = 1 - dist / maxLen;
  return similarity >= 0.72 ? similarity : 0;
}

/**
 * Scores lexical + fuzzy overlap between a customer query and a target document string.
 * Returns a normalized confidence score in [0, 1].
 */
export function computeTextMatchScore(
  query: string,
  targetText: string,
  extraKeywords: string[] = []
): number {
  const normQuery = normalizeText(query);
  const normTarget = normalizeText(targetText);
  if (!normQuery || !normTarget) return 0;

  // Direct substring boost (e.g. exact product name mentioned in query)
  let exactPhraseBoost = 0;
  if (normQuery.includes(normTarget) && normTarget.length >= 4) {
    exactPhraseBoost = 0.45;
  } else if (normTarget.includes(normQuery) && normQuery.length >= 4) {
    exactPhraseBoost = 0.35;
  }

  const queryTokens = tokenize(query);
  const targetTokens = new Set([
    ...tokenize(targetText),
    ...extraKeywords.flatMap((kw) => tokenize(kw)),
  ]);

  if (queryTokens.length === 0 || targetTokens.size === 0) return exactPhraseBoost;

  const targetList = Array.from(targetTokens);
  let matchedScoreSum = 0;
  for (const qt of queryTokens) {
    let best = 0;
    for (const tt of targetList) {
      const sim = fuzzyTokenSimilarity(qt, tt);
      if (sim > best) best = sim;
      if (best === 1) break;
    }
    matchedScoreSum += best;
  }

  const queryCoverage = matchedScoreSum / queryTokens.length;
  // Also measure how much of a short target title (like a product name) was covered
  const targetCoverage =
    targetList.length <= 6
      ? Math.min(1, matchedScoreSum / targetList.length)
      : queryCoverage;

  const combined = queryCoverage * 0.65 + targetCoverage * 0.35 + exactPhraseBoost;
  return Math.min(1, Number(combined.toFixed(3)));
}
