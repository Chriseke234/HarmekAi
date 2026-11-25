import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { chunkKnowledgeText, computeContentHash } from "@/lib/knowledge/service";

const CreateKnowledgeSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("product"),
    name: z.string().min(1).max(160),
    description: z.string().max(1500).default(""),
    price: z.number().nonnegative().nullable().optional(),
    currency: z.string().max(10).default("USD"),
    category: z.string().max(80).default("General"),
    availability: z
      .enum(["in_stock", "out_of_stock", "preorder", "limited"])
      .default("in_stock"),
    keywords: z.array(z.string()).default([]),
  }),
  z.object({
    kind: z.literal("service"),
    name: z.string().min(1).max(160),
    description: z.string().max(1500).default(""),
    price: z.number().nonnegative().nullable().optional(),
    currency: z.string().max(10).default("USD"),
    duration_label: z.string().max(60).nullable().optional(),
    category: z.string().max(80).default("General"),
    booking_required: z.boolean().default(false),
    keywords: z.array(z.string()).default([]),
  }),
  z.object({
    kind: z.literal("faq"),
    question: z.string().min(3).max(500),
    answer: z.string().min(2).max(2000),
    category: z.string().max(80).default("General"),
    keywords: z.array(z.string()).default([]),
  }),
  z.object({
    kind: z.literal("source"),
    source_type: z.enum([
      "policy",
      "delivery",
      "booking",
      "business_info",
      "document",
      "url",
    ]),
    title: z.string().min(2).max(200),
    category: z.string().max(80).default("General"),
    content: z.string().min(5).max(50000),
    source_url: z.string().url().optional().or(z.literal("")).nullable(),
  }),
]);

export async function GET() {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createSupabaseServerClient();
  const workspaceId = auth.context.workspace.id;

  const [products, services, faqs, sources] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("services")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("faqs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("knowledge_sources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    products: products.data ?? [],
    services: services.data ?? [],
    faqs: faqs.data ?? [],
    sources: sources.data ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = CreateKnowledgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid knowledge entry." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const workspaceId = auth.context.workspace.id;
    const item = parsed.data;

    if (item.kind === "product") {
      const { kind: _k, ...fields } = item;
      const { data, error } = await supabase
        .from("products")
        .insert({ workspace_id: workspaceId, ...fields })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ item: data }, { status: 201 });
    }

    if (item.kind === "service") {
      const { kind: _k, ...fields } = item;
      const { data, error } = await supabase
        .from("services")
        .insert({ workspace_id: workspaceId, ...fields })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ item: data }, { status: 201 });
    }

    if (item.kind === "faq") {
      const { kind: _k, ...fields } = item;
      const { data, error } = await supabase
        .from("faqs")
        .insert({ workspace_id: workspaceId, ...fields })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ item: data }, { status: 201 });
    }

    // Knowledge source with SHA-256 duplicate detection and safe chunking
    const contentHash = computeContentHash(item.title, item.content);
    const { data: duplicate } = await supabase
      .from("knowledge_sources")
      .select("id, title")
      .eq("workspace_id", workspaceId)
      .eq("content_hash", contentHash)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          error: `Duplicate content detected — already stored under "${duplicate.title}".`,
          duplicateId: duplicate.id,
        },
        { status: 409 }
      );
    }

    const chunks = chunkKnowledgeText(item.content);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Document content could not be indexed because it is empty." },
        { status: 400 }
      );
    }

    const { data: source, error: srcError } = await supabase
      .from("knowledge_sources")
      .insert({
        workspace_id: workspaceId,
        source_type: item.source_type,
        title: item.title,
        category: item.category,
        content: item.content,
        source_url: item.source_url || null,
        content_hash: contentHash,
        status: "indexed",
      })
      .select("*")
      .single();

    if (srcError || !source) {
      return NextResponse.json(
        { error: srcError?.message ?? "Failed to store knowledge source." },
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

    return NextResponse.json({ item: source, chunksIndexed: chunks.length }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save knowledge item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");

  const tableMap: Record<string, string> = {
    product: "products",
    service: "services",
    faq: "faqs",
    source: "knowledge_sources",
  };

  const table = kind ? tableMap[kind] : null;
  if (!table || !id) {
    return NextResponse.json({ error: "Valid kind and id are required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("workspace_id", auth.context.workspace.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
