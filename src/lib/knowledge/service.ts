import crypto from "crypto";
import { sanitizeUserText } from "@/lib/security/sanitize";

/**
 * Generates a deterministic SHA-256 content hash for duplicate detection in the Knowledge Base.
 */
export function computeContentHash(title: string, content: string): string {
  const normalized = `${title.trim().toLowerCase()}::${content
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Splits a long business document into clean, overlapping chunks for structured retrieval.
 */
export function chunkKnowledgeText(rawContent: string, maxChunkChars = 800): string[] {
  const clean = sanitizeUserText(rawContent, 50_000);
  if (!clean) return [];
  if (clean.length <= maxChunkChars) return [clean];

  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).trim().length <= maxChunkChars) {
      current = current ? `${current}\n\n${para}` : para;
    } else {
      if (current) chunks.push(current);
      if (para.length > maxChunkChars) {
        for (let i = 0; i < para.length; i += maxChunkChars) {
          chunks.push(para.slice(i, i + maxChunkChars).trim());
        }
        current = "";
      } else {
        current = para;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
