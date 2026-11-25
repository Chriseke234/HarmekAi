import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  extractWhatsAppMessages,
  sendWhatsAppTextMessage,
  verifyMetaWebhookSignature,
} from "@/lib/integrations/whatsapp";
import { processCustomerMessage } from "@/lib/conversations/processor";

/**
 * GET /api/webhooks/whatsapp
 * Official Meta WhatsApp Business Platform webhook challenge handshake.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      { error: "WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured on the server." },
      { status: 503 }
    );
  }

  if (mode === "subscribe" && token === expectedToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp
 * Receives verified Meta WhatsApp Cloud API messages, routes them through Harmek AI's
 * Intelligence Router for the matching tenant workspace, and dispatches replies if AI is active.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET;
  const signature = request.headers.get("x-hub-signature-256");

  // Enforce HMAC signature validation whenever META_APP_SECRET is configured
  if (appSecret && !verifyMetaWebhookSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const inboundMessages = extractWhatsAppMessages(payload);
  if (inboundMessages.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const admin = createSupabaseAdminClient();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  let processed = 0;

  for (const inbound of inboundMessages) {
    // Match tenant workspace by verified WhatsApp Phone Number ID
    const { data: integration } = await admin
      .from("integrations")
      .select("workspace_id, status, public_config")
      .eq("provider", "whatsapp")
      .filter("public_config->>identifier", "eq", inbound.phoneNumberId)
      .maybeSingle();

    if (!integration) continue;

    // Mark integration as officially connected once a real verified webhook event arrives
    if (integration.status !== "connected") {
      await admin
        .from("integrations")
        .update({ status: "connected", verified_at: new Date().toISOString() })
        .eq("workspace_id", integration.workspace_id)
        .eq("provider", "whatsapp");
    }

    // Find or create contact by WhatsApp phone
    let { data: contact } = await admin
      .from("contacts")
      .select("id")
      .eq("workspace_id", integration.workspace_id)
      .eq("phone", inbound.fromPhone)
      .maybeSingle();

    if (!contact) {
      const { data: created } = await admin
        .from("contacts")
        .insert({
          workspace_id: integration.workspace_id,
          full_name: inbound.senderName,
          phone: inbound.fromPhone,
          tags: ["whatsapp"],
        })
        .select("id")
        .single();
      contact = created;
    }

    // Find active WhatsApp conversation or start a new one
    let { data: conversation } = await admin
      .from("conversations")
      .select("id")
      .eq("workspace_id", integration.workspace_id)
      .eq("contact_id", contact?.id ?? "")
      .eq("channel", "whatsapp")
      .neq("status", "resolved")
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversation) {
      const { data: createdConv } = await admin
        .from("conversations")
        .insert({
          workspace_id: integration.workspace_id,
          contact_id: contact?.id ?? null,
          channel: "whatsapp",
          status: "ai_handling",
        })
        .select("id")
        .single();
      conversation = createdConv;
    }

    if (!conversation) continue;

    const result = await processCustomerMessage({
      workspaceId: integration.workspace_id,
      conversationId: conversation.id,
      content: inbound.text,
    });

    // Send reply back to WhatsApp only if AI was NOT suppressed (human takeover respected!)
    if (!result.suppressed && result.assistantMessage?.content && accessToken) {
      await sendWhatsAppTextMessage({
        phoneNumberId: inbound.phoneNumberId,
        accessToken,
        toPhone: inbound.fromPhone,
        text: result.assistantMessage.content,
      });
    }
    processed += 1;
  }

  return NextResponse.json({ ok: true, processed });
}
