import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { chunkKnowledgeText, computeContentHash } from "@/lib/knowledge/service";
import {
  extractReadableTextFromHtml,
  parseCsvRecords,
  validatePublicUrl,
} from "@/lib/knowledge/importer";

const ImportSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("url"),
    url: z.string().min(8).max(500),
    category: z.string().max(80).default("Website"),
  }),
  z.object({
    mode: z.literal("csv_products"),
    csvText: z.string().min(5).max(200_000),
  }),
  z.object({
    mode: z.literal("csv_faqs"),
    csvText: z.string().min(5).max(200_000),
  }),
  z.object({
    mode: z.literal("file_document"),
    title: z.string().min(2).max(200),
    content: z.string().min(5).max(100_000),
    category: z.string().max(80).default("Uploaded Document"),
  }),
]);

export async function POST(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = ImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid import payload." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const workspaceId = auth.context.workspace.id;
    const data = parsed.data;

    // 1. Safe Website URL Import (SSRF-guarded)
    if (data.mode === "url") {
      const urlCheck = validatePublicUrl(data.url);
      if (!urlCheck.ok) {
        return NextResponse.json({ error: urlCheck.error }, { status: 400 });
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      let html = "";
      try {
        const res = await fetch(urlCheck.url.toString(), {
          signal: controller.signal,
          headers: { "User-Agent": "HarmekAI-KnowledgeBot/1.0" },
        });
        if (!res.ok) {
          throw new Error(`Website returned HTTP ${res.status}`);
        }
        html = await res.text();
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Could not fetch website URL.";
        // Record honest failed status instead of pretending it indexed
        await supabase.from("knowledge_sources").insert({
          workspace_id: workspaceId,
          source_type: "url",
          title: urlCheck.url.hostname,
          category: data.category,
          content: "",
          source_url: urlCheck.url.toString(),
          status: "failed",
          error_message: errMsg,
        });
        return NextResponse.json({ error: `Import failed: ${errMsg}` }, { status: 422 });
      } finally {
        clearTimeout(timer);
      }

      const extracted = extractReadableTextFromHtml(html);
      const chunks = chunkKnowledgeText(extracted.text);
      if (chunks.length === 0) {
        return NextResponse.json(
          { error: "No readable text could be extracted from that URL." },
          { status: 422 }
        );
      }

      const contentHash = computeContentHash(extracted.title, extracted.text);
      const { data: dup } = await supabase
        .from("knowledge_sources")
        .select("id, title")
        .eq("workspace_id", workspaceId)
        .eq("content_hash", contentHash)
        .maybeSingle();

      if (dup) {
        return NextResponse.json(
          { error: `This page is already indexed under "${dup.title}".` },
          { status: 409 }
        );
      }

      const { data: source, error: srcErr } = await supabase
        .from("knowledge_sources")
        .insert({
          workspace_id: workspaceId,
          source_type: "url",
          title: extracted.title,
          category: data.category,
          content: extracted.text,
          source_url: urlCheck.url.toString(),
          content_hash: contentHash,
          status: "indexed",
        })
        .select("*")
        .single();

      if (srcErr || !source) {
        return NextResponse.json(
          { error: srcErr?.message ?? "Failed to store imported page." },
          { status: 400 }
        );
      }

      await supabase.from("knowledge_chunks").insert(
        chunks.map((chunk, idx) => ({
          workspace_id: workspaceId,
          source_id: source.id,
          chunk_index: idx,
          content: chunk,
          token_count: chunk.split(/\s+/).length,
        }))
      );

      return NextResponse.json(
        {
          ok: true,
          title: extracted.title,
          chunksIndexed: chunks.length,
          message: `Imported "${extracted.title}" (${chunks.length} searchable chunks indexed).`,
        },
        { status: 201 }
      );
    }

    // 2. Bulk CSV Products Import
    if (data.mode === "csv_products") {
      const records = parseCsvRecords(data.csvText);
      const validRows = records
        .filter((r) => Boolean(r.name?.trim()))
        .slice(0, 200)
        .map((r) => {
          const parsedPrice = r.price ? Number.parseFloat(r.price.replace(/[^0-9.]/g, "")) : NaN;
          return {
            workspace_id: workspaceId,
            name: r.name.trim().slice(0, 160),
            price: Number.isNaN(parsedPrice) ? null : parsedPrice,
            currency: (r.currency || "USD").toUpperCase().slice(0, 10),
            category: (r.category || "General").slice(0, 80),
            description: (r.description || "").slice(0, 1500),
            availability: ["in_stock", "out_of_stock", "preorder", "limited"].includes(
              r.availability
            )
              ? r.availability
              : "in_stock",
          };
        });

      if (validRows.length === 0) {
        return NextResponse.json(
          { error: 'No valid product rows found. Ensure your CSV has a "name" column.' },
          { status: 400 }
        );
      }

      const { error } = await supabase.from("products").insert(validRows);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json(
        {
          ok: true,
          imported: validRows.length,
          skipped: Math.max(0, records.length - validRows.length),
          message: `Imported ${validRows.length} products into your Knowledge Base.`,
        },
        { status: 201 }
      );
    }

    // 3. Bulk CSV FAQs Import
    if (data.mode === "csv_faqs") {
      const records = parseCsvRecords(data.csvText);
      const validRows = records
        .filter((r) => Boolean(r.question?.trim()) && Boolean(r.answer?.trim()))
        .slice(0, 200)
        .map((r) => ({
          workspace_id: workspaceId,
          question: r.question.trim().slice(0, 500),
          answer: r.answer.trim().slice(0, 2000),
          category: (r.category || "General").slice(0, 80),
        }));

      if (validRows.length === 0) {
        return NextResponse.json(
          { error: 'No valid FAQ rows found. Ensure your CSV has "question" and "answer" columns.' },
          { status: 400 }
        );
      }

      const { error } = await supabase.from("faqs").insert(validRows);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json(
        {
          ok: true,
          imported: validRows.length,
          skipped: Math.max(0, records.length - validRows.length),
          message: `Imported ${validRows.length} FAQs into your Knowledge Base.`,
        },
        { status: 201 }
      );
    }

    // 4. Uploaded Document (.txt, .md, .json)
    const chunks = chunkKnowledgeText(data.content);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "Uploaded file contains no readable text." }, { status: 400 });
    }
    const contentHash = computeContentHash(data.title, data.content);
    const { data: dup } = await supabase
      .from("knowledge_sources")
      .select("id, title")
      .eq("workspace_id", workspaceId)
      .eq("content_hash", contentHash)
      .maybeSingle();
    if (dup) {
      return NextResponse.json(
        { error: `Duplicate document — already stored under "${dup.title}".` },
        { status: 409 }
      );
    }

    const { data: source, error: docErr } = await supabase
      .from("knowledge_sources")
      .insert({
        workspace_id: workspaceId,
        source_type: "document",
        title: data.title.trim(),
        category: data.category,
        content: data.content,
        content_hash: contentHash,
        status: "indexed",
      })
      .select("*")
      .single();

    if (docErr || !source) {
      return NextResponse.json(
        { error: docErr?.message ?? "Failed to store document." },
        { status: 400 }
      );
    }

    await supabase.from("knowledge_chunks").insert(
      chunks.map((chunk, idx) => ({
        workspace_id: workspaceId,
        source_id: source.id,
        chunk_index: idx,
        content: chunk,
        token_count: chunk.split(/\s+/).length,
      }))
    );

    return NextResponse.json(
      {
        ok: true,
        chunksIndexed: chunks.length,
        message: `Indexed "${data.title}" (${chunks.length} searchable chunks).`,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Knowledge import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
