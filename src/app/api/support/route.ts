import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeUserText } from "@/lib/security/sanitize";

const SupportRequestSchema = z.object({
  fullName: z.string().min(2, "Please enter your name.").max(120),
  email: z.string().email("Please enter a valid email address.").max(160),
  businessName: z.string().max(120).optional().default(""),
  topic: z
    .enum([
      "General Support",
      "Onboarding & Setup Help",
      "Billing & 14-Day Trial",
      "WhatsApp & Integrations",
      "Security & Privacy",
    ])
    .default("General Support"),
  message: z
    .string()
    .min(10, "Please describe how we can help (at least 10 characters).")
    .max(4000),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = checkRateLimit(`support:${ip}`, 5, 60_000 * 10);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many support requests sent recently. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = SupportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid support request." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("support_requests")
      .insert({
        full_name: sanitizeUserText(d.fullName, 120),
        email: d.email.trim().toLowerCase(),
        business_name: sanitizeUserText(d.businessName, 120) || null,
        topic: d.topic,
        message: sanitizeUserText(d.message, 4000),
      })
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        ok: true,
        ticketId: data.id,
        message:
          "Your message has been logged with the Harmek AI support team. We will reply to your email shortly.",
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not submit support request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
