/**
 * Lexical normalization, tokenization, business-domain synonym expansion,
 * fuzzy Levenshtein similarity, and BM25-inspired IDF scoring for the
 * Native Harmek Intelligence Engine (zero external LLM dependency).
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
 * Business-domain synonym groups so everyday customer phrasing matches
 * structured catalog and policy entries without requiring embeddings.
 */
const SYNONYM_GROUPS: string[][] = [
  ["price", "cost", "rate", "fee", "charge", "pricing", "amount", "expensive", "cheap"],
  ["delivery", "shipping", "dispatch", "courier", "waybill", "ship", "deliver", "dropoff"],
  ["book", "booking", "appointment", "reserve", "reservation", "schedule", "slot"],
  ["open", "opening", "hour", "close", "closing", "schedule", "weekend"],
  ["return", "refund", "exchange", "warranty", "cancel", "cancellation", "policy"],
  ["available", "availability", "stock", "instock", "carry", "sell"],
  ["location", "address", "branch", "store", "shop", "direction", "office"],
  ["wash", "laundry", "clean", "cleaning", "iron", "ironing", "dryclean"],
  ["recommend", "suggest", "best", "advice", "suitable", "good"],
];

const SYNONYM_MAP = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const term of group) {
    SYNONYM_MAP.set(term, group);
  }
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
 * Expands a token list with business-domain synonyms (weighted lightly during scoring).
 */
export function expandWithSynonyms(tokens: string[]): Set<string> {
  const expanded = new Set<string>(tokens);
  for (const t of tokens) {
    const syns = SYNONYM_MAP.get(t);
    if (syns) {
      for (const s of syns) expanded.add(stemToken(s));
    }
  }
  return expanded;
}

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
 * Computes corpus-wide inverse document frequency (IDF) weights for BM25 scoring.
 * Rare, specific product words ("retinol", "vitamin", "duvet") receive higher weight
 * than generic words ("product", "service", "item").
 */
export function buildIdfMap(documents: string[]): Map<string, number> {
  const docFreq = new Map<string, number>();
  const totalDocs = Math.max(1, documents.length);

  for (const doc of documents) {
    const uniqueTokens = new Set(tokenize(doc));
    for (const t of uniqueTokens) {
      docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [token, df] of docFreq.entries()) {
    // Standard BM25+ smoothed IDF
    const weight = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5)) + 0.5;
    idf.set(token, Number(weight.toFixed(3)));
  }
  return idf;
}

/**
 * Scores lexical + synonym + fuzzy + BM25-IDF overlap between a customer query and target text.
 * Returns a normalized confidence score in [0, 1].
 */
export function computeTextMatchScore(
  query: string,
  targetText: string,
  extraKeywords: string[] = [],
  idfMap?: Map<string, number>
): number {
  const normQuery = normalizeText(query);
  const normTarget = normalizeText(targetText);
  if (!normQuery || !normTarget) return 0;

  let exactPhraseBoost = 0;
  if (normQuery.includes(normTarget) && normTarget.length >= 4) {
    exactPhraseBoost = 0.45;
  } else if (normTarget.includes(normQuery) && normQuery.length >= 4) {
    exactPhraseBoost = 0.35;
  }

  const queryTokens = tokenize(query);
  const rawTargetTokens = [
    ...tokenize(targetText),
    ...extraKeywords.flatMap((kw) => tokenize(kw)),
  ];
  const expandedTargetSet = expandWithSynonyms(rawTargetTokens);

  if (queryTokens.length === 0 || expandedTargetSet.size === 0) return exactPhraseBoost;

  const targetList = Array.from(expandedTargetSet);
  const directTargetSet = new Set(rawTargetTokens);

  let weightedMatchSum = 0;
  let totalWeight = 0;

  for (const qt of queryTokens) {
    const idfWeight = idfMap?.get(qt) ?? 1.0;
    totalWeight += idfWeight;

    let best = 0;
    for (const tt of targetList) {
      const sim = fuzzyTokenSimilarity(qt, tt);
      // Slight discount if matched only via synonym expansion rather than direct word
      const adjusted = directTargetSet.has(tt) ? sim : sim * 0.85;
      if (adjusted > best) best = adjusted;
      if (best === 1) break;
    }
    weightedMatchSum += best * idfWeight;
  }

  const queryCoverage = totalWeight > 0 ? weightedMatchSum / totalWeight : 0;
  const targetCoverage =
    rawTargetTokens.length > 0 && rawTargetTokens.length <= 6
      ? Math.min(1, weightedMatchSum / rawTargetTokens.length)
      : queryCoverage;

  const combined = queryCoverage * 0.65 + targetCoverage * 0.35 + exactPhraseBoost;
  return Math.min(1, Number(combined.toFixed(3)));
}
