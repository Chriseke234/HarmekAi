import type {
  BusinessProfile,
  FaqItem,
  KnowledgeSource,
  KnowledgeSourceRef,
  Product,
  Service,
} from "@/types/database";
import { buildIdfMap, computeTextMatchScore } from "./tokenizer";
import type { NativeIntent } from "./intent-detector";
import { formatCurrency } from "@/lib/utils";

export interface KnowledgeChunkRecord {
  id: string;
  source_id: string;
  chunk_index: number;
  content: string;
}

export interface WorkspaceKnowledgeBundle {
  businessProfile: BusinessProfile | null;
  products: Product[];
  services: Service[];
  faqs: FaqItem[];
  knowledgeSources: KnowledgeSource[];
  knowledgeChunks?: KnowledgeChunkRecord[];
}

export interface KnowledgeMatchCandidate {
  type: KnowledgeSourceRef["type"];
  id: string;
  title: string;
  score: number;
  answerText: string;
  product?: Product;
  service?: Service;
  faq?: FaqItem;
  source?: KnowledgeSource;
}

function formatAvailabilityLabel(availability: Product["availability"]): string {
  switch (availability) {
    case "in_stock":
      return "currently in stock";
    case "out_of_stock":
      return "currently out of stock";
    case "preorder":
      return "available for pre-order";
    case "limited":
      return "in limited stock";
    default:
      return "available upon confirmation";
  }
}

function formatOperatingHours(hours: Record<string, string> | null | undefined): string {
  if (!hours) return "";
  const entries = Object.entries(hours).filter(([, val]) => Boolean(val?.trim()));
  if (entries.length === 0) return "";
  return entries.map(([day, time]) => `${day}: ${time}`).join("; ");
}

/**
 * Retrieves and ranks structured business knowledge candidates for a given customer query.
 * Works purely on structured database records with zero vector DB or external LLM calls.
 */
export function matchWorkspaceKnowledge(
  query: string,
  intent: NativeIntent,
  bundle: WorkspaceKnowledgeBundle
): KnowledgeMatchCandidate[] {
  const candidates: KnowledgeMatchCandidate[] = [];
  const bp = bundle.businessProfile;

  // Build corpus-wide BM25 IDF weights across all active structured items
  const idfMap = buildIdfMap([
    ...bundle.products.filter((p) => p.is_active).map((p) => `${p.name} ${p.description}`),
    ...bundle.services.filter((s) => s.is_active).map((s) => `${s.name} ${s.description}`),
    ...bundle.faqs.filter((f) => f.is_active).map((f) => `${f.question} ${f.answer}`),
    ...bundle.knowledgeSources.filter((s) => s.status === "indexed").map((s) => `${s.title} ${s.content.slice(0, 400)}`),
    ...(bundle.knowledgeChunks ?? []).map((c) => c.content),
  ]);

  // 1. Direct Business Profile structured intents
  if (bp) {
    if (intent === "business_hours") {
      const hoursText = formatOperatingHours(bp.operating_hours);
      if (hoursText) {
        candidates.push({
          type: "business_profile",
          id: bp.id,
          title: "Operating Hours",
          score: 0.94,
          answerText: `Our operating hours at ${bp.business_name} are: ${hoursText}.`,
        });
      }
    }

    if (intent === "location_contact") {
      const parts: string[] = [];
      if (bp.location_address) parts.push(`Address: ${bp.location_address}`);
      if (bp.business_phone) parts.push(`Phone: ${bp.business_phone}`);
      if (bp.business_email) parts.push(`Email: ${bp.business_email}`);
      if (bp.website) parts.push(`Website: ${bp.website}`);
      if (parts.length > 0) {
        candidates.push({
          type: "business_profile",
          id: bp.id,
          title: "Location & Contact Details",
          score: 0.92,
          answerText: `You can reach ${bp.business_name} using these details — ${parts.join(" | ")}.`,
        });
      }
    }

    if (intent === "delivery_info" && bp.delivery_info?.trim()) {
      candidates.push({
        type: "business_profile",
        id: bp.id,
        title: "Delivery Information",
        score: 0.92,
        answerText: bp.delivery_info.trim(),
      });
    }

    if (intent === "booking_info" && bp.booking_info?.trim()) {
      candidates.push({
        type: "business_profile",
        id: bp.id,
        title: "Booking Information",
        score: 0.92,
        answerText: bp.booking_info.trim(),
      });
    }

    if (intent === "policy_query" && bp.return_policy?.trim()) {
      candidates.push({
        type: "business_profile",
        id: bp.id,
        title: "Business Policy",
        score: 0.9,
        answerText: bp.return_policy.trim(),
      });
    }
  }

  // 2. Structured Products
  for (const product of bundle.products.filter((p) => p.is_active)) {
    const nameScore = computeTextMatchScore(query, product.name, product.keywords, idfMap);
    const fullScore = computeTextMatchScore(
      query,
      `${product.name} ${product.category} ${product.description}`,
      product.keywords,
      idfMap
    );
    let score = Math.max(nameScore, fullScore * 0.9);
    if (
      (intent === "product_price" ||
        intent === "product_availability" ||
        intent === "product_info") &&
      score >= 0.35
    ) {
      score = Math.min(0.98, score + 0.12);
    }

    if (score >= 0.3) {
      const priceText =
        product.price !== null
          ? formatCurrency(product.price, product.currency)
          : "pricing is confirmed by our team";
      const availText = formatAvailabilityLabel(product.availability);
      const descText = product.description ? ` ${product.description}` : "";

      let answerText = `${product.name} is ${priceText} and is ${availText}.${descText}`;
      if (intent === "product_price" && product.price === null) {
        answerText = `We offer ${product.name}, though its exact price is not listed in our catalog yet. Our team can confirm the current price for you.`;
      }

      candidates.push({
        type: "product",
        id: product.id,
        title: product.name,
        score: Number(score.toFixed(3)),
        answerText,
        product,
      });
    }
  }

  // 3. Structured Services
  for (const service of bundle.services.filter((s) => s.is_active)) {
    const nameScore = computeTextMatchScore(query, service.name, service.keywords);
    const fullScore = computeTextMatchScore(
      query,
      `${service.name} ${service.category} ${service.description}`,
      service.keywords
    );
    let score = Math.max(nameScore, fullScore * 0.9);
    if (
      (intent === "service_info" ||
        intent === "product_price" ||
        intent === "booking_info") &&
      score >= 0.35
    ) {
      score = Math.min(0.98, score + 0.12);
    }

    if (score >= 0.3) {
      const priceText =
        service.price !== null
          ? formatCurrency(service.price, service.currency)
          : "pricing is available upon request";
      const durationText = service.duration_label ? ` (${service.duration_label})` : "";
      const bookingText = service.booking_required ? " Advance booking is recommended." : "";
      const descText = service.description ? ` ${service.description}` : "";

      candidates.push({
        type: "service",
        id: service.id,
        title: service.name,
        score: Number(score.toFixed(3)),
        answerText: `${service.name}${durationText} is ${priceText}.${descText}${bookingText}`,
        service,
      });
    }
  }

  // 4. Structured FAQs
  for (const faq of bundle.faqs.filter((f) => f.is_active)) {
    const qScore = computeTextMatchScore(query, faq.question, faq.keywords);
    const qaScore = computeTextMatchScore(
      query,
      `${faq.question} ${faq.category}`,
      faq.keywords
    );
    const score = Math.max(qScore, qaScore * 0.95);
    if (score >= 0.32) {
      candidates.push({
        type: "faq",
        id: faq.id,
        title: faq.question,
        score: Number(score.toFixed(3)),
        answerText: faq.answer,
        faq,
      });
    }
  }

  // 5. Additional Knowledge Sources + Deep Chunk-Level Retrieval
  const indexedSources = bundle.knowledgeSources.filter((s) => s.status === "indexed");
  const sourceById = new Map(indexedSources.map((s) => [s.id, s]));
  const chunksBySource = new Map<string, KnowledgeChunkRecord[]>();

  for (const chunk of bundle.knowledgeChunks ?? []) {
    if (!sourceById.has(chunk.source_id)) continue;
    const list = chunksBySource.get(chunk.source_id) ?? [];
    list.push(chunk);
    chunksBySource.set(chunk.source_id, list);
  }

  for (const source of indexedSources) {
    const titleScore = computeTextMatchScore(query, source.title, [], idfMap);
    const sourceChunks = chunksBySource.get(source.id) ?? [];

    let bestExcerpt =
      source.content.length > 420
        ? `${source.content.slice(0, 417).trim()}...`
        : source.content.trim();
    let bestBodyScore = computeTextMatchScore(
      query,
      `${source.title} ${source.content.slice(0, 600)}`,
      [],
      idfMap
    );

    // Search every indexed chunk so long handbooks & scraped web pages return the exact matching paragraph
    for (const chunk of sourceChunks) {
      const chunkScore = computeTextMatchScore(query, chunk.content, [source.title], idfMap);
      if (chunkScore > bestBodyScore) {
        bestBodyScore = chunkScore;
        bestExcerpt =
          chunk.content.length > 480
            ? `${chunk.content.slice(0, 477).trim()}...`
            : chunk.content.trim();
      }
    }

    let score = Math.max(titleScore, bestBodyScore * 0.95);

    if (
      (intent === "policy_query" && source.source_type === "policy") ||
      (intent === "delivery_info" && source.source_type === "delivery") ||
      (intent === "booking_info" && source.source_type === "booking")
    ) {
      score = Math.min(0.95, score + 0.18);
    }

    if (score >= 0.32) {
      candidates.push({
        type: "knowledge_source",
        id: source.id,
        title: source.title,
        score: Number(score.toFixed(3)),
        answerText: bestExcerpt,
        source,
      });
    }
  }

  // Sort highest confidence first
  return candidates.sort((a, b) => b.score - a.score);
}
