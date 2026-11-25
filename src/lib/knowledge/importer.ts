import type { WorkspaceKnowledgeBundle } from "@/lib/intelligence/native/knowledge-matcher";
import { computeTextMatchScore, normalizeText } from "@/lib/intelligence/native/tokenizer";

/**
 * Validates that a user-supplied URL is a public HTTP(S) URL and blocks
 * private/loopback/link-local hosts to prevent SSRF attacks.
 */
export function validatePublicUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Please enter a valid URL starting with https:// or http://." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "Only HTTP and HTTPS URLs are supported." };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return {
      ok: false,
      error: "Private, local, or internal network URLs cannot be imported.",
    };
  }

  return { ok: true, url: parsed };
}

/**
 * Extracts a clean document title and readable text from raw HTML without heavy DOM dependencies.
 */
export function extractReadableTextFromHtml(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleMatch?.[1]?.replace(/\s+/g, " ").trim() || "Imported Web Page";

  const stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(?:nav|footer|header)\b[^>]*>[\s\S]*?<\/(?:nav|footer|header)>/gi, " ")
    .replace(/<\/(?:p|div|li|h[1-6]|tr|section|article|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    title: rawTitle.slice(0, 180),
    text: stripped.slice(0, 45_000),
  };
}

/**
 * RFC-4180 compliant CSV parser supporting quoted commas and escaped quotes.
 * Returns array of objects keyed by lowercased header names.
 */
export function parseCsvRecords(csvText: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const normalized = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (ch === "\n") {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += ch;
      }
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));

  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = cells[idx] ?? "";
    });
    return record;
  });
}

export interface KnowledgeHealthIssue {
  severity: "warning" | "info" | "error";
  category: "conflict" | "missing_info" | "duplicate" | "indexing";
  message: string;
}

export interface KnowledgeHealthReport {
  score: number;
  totalEntries: number;
  issues: KnowledgeHealthIssue[];
}

/**
 * Audits a workspace's Knowledge Base for conflicting prices, missing business
 * fundamentals, near-duplicate FAQs, and failed document indexing.
 */
export function auditKnowledgeHealth(bundle: WorkspaceKnowledgeBundle): KnowledgeHealthReport {
  const issues: KnowledgeHealthIssue[] = [];
  const bp = bundle.businessProfile;
  const activeProducts = bundle.products.filter((p) => p.is_active);
  const activeServices = bundle.services.filter((s) => s.is_active);
  const activeFaqs = bundle.faqs.filter((f) => f.is_active);

  // 1. Check essential business profile info
  if (!bp || Object.keys(bp.operating_hours ?? {}).length === 0) {
    issues.push({
      severity: "warning",
      category: "missing_info",
      message: "Operating hours are not set yet — customers frequently ask when you are open.",
    });
  }
  if (!bp?.delivery_info?.trim()) {
    issues.push({
      severity: "info",
      category: "missing_info",
      message: "Delivery or shipping information is blank in Settings.",
    });
  }
  if (!bp?.return_policy?.trim()) {
    issues.push({
      severity: "info",
      category: "missing_info",
      message: "Return or cancellation policy is blank in Settings.",
    });
  }

  // 2. Detect conflicting prices across products with the same normalized name
  const productPriceMap = new Map<string, Set<number>>();
  let missingPriceCount = 0;
  for (const p of activeProducts) {
    if (p.price === null || p.price === undefined) {
      missingPriceCount += 1;
      continue;
    }
    const key = normalizeText(p.name);
    const set = productPriceMap.get(key) ?? new Set<number>();
    set.add(Number(p.price));
    productPriceMap.set(key, set);
  }

  for (const [nameKey, prices] of productPriceMap.entries()) {
    if (prices.size > 1) {
      issues.push({
        severity: "error",
        category: "conflict",
        message: `Conflicting prices detected for "${nameKey}" (${Array.from(prices).join(" vs ")}). Edit or remove the outdated entry.`,
      });
    }
  }

  if (missingPriceCount > 0) {
    issues.push({
      severity: "warning",
      category: "missing_info",
      message: `${missingPriceCount} active product${missingPriceCount === 1 ? "" : "s"} ha${missingPriceCount === 1 ? "s" : "ve"} no listed price.`,
    });
  }

  // 3. Detect near-duplicate FAQs
  for (let i = 0; i < activeFaqs.length; i++) {
    for (let j = i + 1; j < activeFaqs.length; j++) {
      const sim = computeTextMatchScore(activeFaqs[i].question, activeFaqs[j].question);
      if (sim >= 0.85) {
        issues.push({
          severity: "warning",
          category: "duplicate",
          message: `Near-duplicate FAQs detected: "${activeFaqs[i].question.slice(0, 50)}" and "${activeFaqs[j].question.slice(0, 50)}".`,
        });
        break;
      }
    }
  }

  // 4. Detect failed knowledge sources
  const failedSources = bundle.knowledgeSources.filter((s) => s.status === "failed");
  if (failedSources.length > 0) {
    issues.push({
      severity: "error",
      category: "indexing",
      message: `${failedSources.length} document${failedSources.length === 1 ? "" : "s"} failed indexing and cannot be used by Harmek yet.`,
    });
  }

  const totalEntries =
    activeProducts.length +
    activeServices.length +
    activeFaqs.length +
    bundle.knowledgeSources.filter((s) => s.status === "indexed").length;

  let penalty = 0;
  for (const iss of issues) {
    penalty += iss.severity === "error" ? 20 : iss.severity === "warning" ? 10 : 5;
  }
  if (totalEntries === 0) penalty += 30;

  return {
    score: Math.max(10, Math.min(100, 100 - penalty)),
    totalEntries,
    issues,
  };
}
