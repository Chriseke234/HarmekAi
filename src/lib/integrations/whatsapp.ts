import crypto from "crypto";

/**
 * Official Meta WhatsApp Business Platform (Cloud API) integration utilities.
 * - Verifies HMAC-SHA256 X-Hub-Signature-256 webhook signatures.
 * - Parses official Cloud API inbound text message payloads.
 * - Sends replies via official Meta Graph API (never uses unofficial scrapers).
 */

export interface WhatsAppInboundMessage {
  phoneNumberId: string;
  fromPhone: string;
  senderName: string | null;
  messageId: string;
  text: string;
}

/**
 * Verifies Meta's `X-Hub-Signature-256` header against the raw request body.
 */
export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;
  const expected = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  const sigBuf = Buffer.from(signatureHeader);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Extracts inbound customer text messages from an official Meta WhatsApp Cloud API webhook payload.
 */
export function extractWhatsAppMessages(payload: unknown): WhatsAppInboundMessage[] {
  const results: WhatsAppInboundMessage[] = [];
  if (!payload || typeof payload !== "object") return results;

  const entries = (payload as { entry?: Array<{ changes?: Array<{ value?: Record<string, unknown> }> }> }).entry;
  if (!Array.isArray(entries)) return results;

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;

      const metadata = value.metadata as { phone_number_id?: string } | undefined;
      const phoneNumberId = metadata?.phone_number_id;
      const contacts = (value.contacts as Array<{ wa_id?: string; profile?: { name?: string } }>) ?? [];
      const messages = (value.messages as Array<{
        id?: string;
        from?: string;
        type?: string;
        text?: { body?: string };
      }>) ?? [];

      if (!phoneNumberId) continue;

      for (const msg of messages) {
        if (msg.type === "text" && msg.from && msg.text?.body && msg.id) {
          const contactMatch = contacts.find((c) => c.wa_id === msg.from);
          results.push({
            phoneNumberId,
            fromPhone: msg.from,
            senderName: contactMatch?.profile?.name ?? null,
            messageId: msg.id,
            text: msg.text.body.trim(),
          });
        }
      }
    }
  }

  return results;
}

/**
 * Sends a text reply through the official Meta WhatsApp Cloud API.
 */
export async function sendWhatsAppTextMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  toPhone: string;
  text: string;
}): Promise<{ ok: boolean; status: number; error?: string }> {
  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
    params.phoneNumberId
  )}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: params.toPhone,
      type: "text",
      text: { body: params.text },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    return {
      ok: false,
      status: response.status,
      error: errText || `WhatsApp Graph API HTTP ${response.status}`,
    };
  }
  return { ok: true, status: response.status };
}
