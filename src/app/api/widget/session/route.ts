import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";

const SessionSchema = z.object({
  widgetKey: z.string().min(12),
  visitorToken: z.string().max(120).optional().nullable(),
  consentPersistence: z.boolean().default(false),
  visitorName: z.string().max(120).optional(),
  visitorEmail: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid widget session payload." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = checkRateLimit(`widget_sess:${ip}:${parsed.data.widgetKey}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
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

    const token =
      parsed.data.consentPersistence && parsed.data.visitorToken
        ? parsed.data.visitorToken
        : crypto.randomBytes(16).toString("hex");

    // Resume existing contact/conversation only when consentPersistence is true
    let contactId: string | null = null;
    if (parsed.data.consentPersistence && parsed.data.visitorToken) {
      const { data: existingContact } = await admin
        .from("contacts")
        .select("id")
        .eq("workspace_id", workspace.id)
        .eq("visitor_token", parsed.data.visitorToken)
        .maybeSingle();

      if (existingContact) {
        contactId = existingContact.id;
        const { data: existingConv } = await admin
          .from("conversations")
          .select("id, status, human_takeover")
          .eq("workspace_id", workspace.id)
          .eq("contact_id", contactId)
          .neq("status", "resolved")
          .order("last_message_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingConv) {
          const { data: messages } = await admin
            .from("messages")
            .select("id, sender_type, content, created_at")
            .eq("conversation_id", existingConv.id)
            .order("created_at", { ascending: true });

          return NextResponse.json({
            visitorToken: token,
            conversationId: existingConv.id,
            status: existingConv.status,
            humanTakeover: existingConv.human_takeover,
            messages: messages ?? [],
          });
        }
      }
    }

    if (!contactId) {
      const { data: newContact } = await admin
        .from("contacts")
        .insert({
          workspace_id: workspace.id,
          visitor_token: parsed.data.consentPersistence ? token : null,
          full_name: parsed.data.visitorName ?? null,
          email: parsed.data.visitorEmail ?? null,
          consent_preferences: {
            chat_persistence: parsed.data.consentPersistence,
            follow_up_messages: false,
          },
        })
        .select("id")
        .single();
      contactId = newContact?.id ?? null;
    }

    const { data: settings } = await admin
      .from("assistant_settings")
      .select("welcome_message")
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    const { data: conv, error: convErr } = await admin
      .from("conversations")
      .insert({
        workspace_id: workspace.id,
        contact_id: contactId,
        channel: "website",
        status: "ai_handling",
      })
      .select("id, status, human_takeover")
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ error: "Unable to start conversation." }, { status: 500 });
    }

    const welcomeText = settings?.welcome_message ?? "Hello! How can I help you today?";
    const { data: welcomeMsg } = await admin
      .from("messages")
      .insert({
        workspace_id: workspace.id,
        conversation_id: conv.id,
        sender_type: "assistant",
        content: welcomeText,
        intelligence_mode: "native",
        intent: "greeting",
        confidence: 1,
      })
      .select("id, sender_type, content, created_at")
      .single();

    return NextResponse.json(
      {
        visitorToken: parsed.data.consentPersistence ? token : null,
        conversationId: conv.id,
        status: conv.status,
        humanTakeover: conv.human_takeover,
        messages: welcomeMsg ? [welcomeMsg] : [],
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to initialize widget session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
