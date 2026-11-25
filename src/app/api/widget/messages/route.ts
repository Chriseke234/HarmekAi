import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { processCustomerMessage } from "@/lib/conversations/processor";

const SendMessageSchema = z.object({
  widgetKey: z.string().min(12),
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const widgetKey = searchParams.get("key")?.trim();
  const conversationId = searchParams.get("conversationId")?.trim();

  if (!widgetKey || !conversationId) {
    return NextResponse.json({ error: "Missing key or conversationId." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id")
    .eq("widget_key", widgetKey)
    .maybeSingle();

  if (!workspace) {
    return NextResponse.json({ error: "Widget not found." }, { status: 404 });
  }

  const [{ data: conv }, { data: messages }] = await Promise.all([
    admin
      .from("conversations")
      .select("status, human_takeover")
      .eq("id", conversationId)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    admin
      .from("messages")
      .select("id, sender_type, content, created_at")
      .eq("conversation_id", conversationId)
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true }),
  ]);

  if (!conv) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({
    status: conv.status,
    humanTakeover: conv.human_takeover,
    messages: messages ?? [],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid message payload." },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = checkRateLimit(`widget_msg:${ip}:${parsed.data.conversationId}`, 25, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "You are sending messages too quickly. Please wait a moment." },
        { status: 429 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: workspace } = await admin
      .from("workspaces")
      .select("id")
      .eq("widget_key", parsed.data.widgetKey)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({ error: "Widget not found." }, { status: 404 });
    }

    const result = await processCustomerMessage({
      workspaceId: workspace.id,
      conversationId: parsed.data.conversationId,
      content: parsed.data.content,
    });

    return NextResponse.json({
      customerMessage: result.customerMessage,
      assistantMessage: result.assistantMessage,
      suppressed: result.suppressed,
      humanHandling: result.suppressed || result.routeResult?.shouldEscalate || false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
