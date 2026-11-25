import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTrialActivationWindow } from "@/lib/billing/trial";

const ActivateSchema = z.object({
  action: z.literal("activate"),
});

const SaveProfileSchema = z.object({
  action: z.literal("save_profile"),
  business_name: z.string().min(2).max(120),
  industry: z.string().min(2).max(80),
  description: z.string().max(2000).default(""),
  website: z.string().max(255).optional().nullable(),
  business_email: z.string().email().optional().or(z.literal("")).nullable(),
  business_phone: z.string().max(50).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  location_address: z.string().max(300).optional().nullable(),
  currency: z.string().max(10).default("USD"),
  operating_hours: z.record(z.string(), z.string()).default({}),
  delivery_info: z.string().max(2000).default(""),
  booking_info: z.string().max(2000).default(""),
  return_policy: z.string().max(2000).default(""),
});

const SaveBehaviourSchema = z.object({
  action: z.literal("save_assistant"),
  assistant_name: z.string().min(1).max(60),
  tone: z.enum(["friendly", "professional", "conversational", "luxury", "supportive", "custom"]),
  formality: z.enum(["casual", "balanced", "formal"]).default("balanced"),
  response_length: z.enum(["brief", "concise", "detailed"]).default("concise"),
  welcome_message: z.string().min(2).max(500),
  supported_languages: z.array(z.string()).default(["English"]),
  allowed_topics: z.array(z.string()).default([]),
  avoided_topics: z.array(z.string()).default([]),
  escalation_keywords: z.array(z.string()).default([]),
  lead_capture_fields: z.array(z.string()).default(["name", "email"]),
  clarification_enabled: z.boolean().default(true),
  onboarding_step: z.number().int().min(1).max(7).optional(),
});

export async function POST(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createSupabaseServerClient();
  const workspaceId = auth.context.workspace.id;

  try {
    const body = await request.json();

    if (body?.action === "save_profile") {
      const parsed = SaveProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid business profile." },
          { status: 400 }
        );
      }
      const { action: _a, ...fields } = parsed.data;
      await supabase
        .from("business_profiles")
        .update({
          ...fields,
          business_email: fields.business_email || null,
          website: fields.website || null,
        })
        .eq("workspace_id", workspaceId);

      await supabase
        .from("workspaces")
        .update({ name: fields.business_name, onboarding_step: 3 })
        .eq("id", workspaceId);

      return NextResponse.json({ ok: true });
    }

    if (body?.action === "save_assistant") {
      const parsed = SaveBehaviourSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid assistant settings." },
          { status: 400 }
        );
      }
      const d = parsed.data;
      await supabase
        .from("assistants")
        .update({ name: d.assistant_name })
        .eq("workspace_id", workspaceId);

      await supabase
        .from("assistant_settings")
        .update({
          tone: d.tone,
          formality: d.formality,
          response_length: d.response_length,
          welcome_message: d.welcome_message,
          supported_languages: d.supported_languages,
          allowed_topics: d.allowed_topics,
          avoided_topics: d.avoided_topics,
          escalation_keywords:
            d.escalation_keywords.length > 0
              ? d.escalation_keywords
              : ["human", "agent", "manager", "speak to someone"],
          lead_capture_fields: d.lead_capture_fields,
          clarification_enabled: d.clarification_enabled,
        })
        .eq("workspace_id", workspaceId);

      if (d.onboarding_step) {
        await supabase
          .from("workspaces")
          .update({ onboarding_step: d.onboarding_step })
          .eq("id", workspaceId);
      }

      return NextResponse.json({ ok: true });
    }

    if (body?.action === "activate") {
      ActivateSchema.parse(body);
      const nowIso = new Date().toISOString();

      await supabase
        .from("assistants")
        .update({ is_active: true, activated_at: nowIso })
        .eq("workspace_id", workspaceId);

      // Start the genuine 14-day trial ONLY if not already started
      const { data: existingTrial } = await supabase
        .from("trial_records")
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (existingTrial && existingTrial.status === "not_started") {
        const window = createTrialActivationWindow(existingTrial.duration_days ?? 14);
        await supabase
          .from("trial_records")
          .update(window)
          .eq("workspace_id", workspaceId);
      }

      await supabase
        .from("workspaces")
        .update({ onboarding_completed: true, onboarding_step: 7 })
        .eq("id", workspaceId);

      return NextResponse.json({ ok: true, activatedAt: nowIso });
    }

    return NextResponse.json({ error: "Unsupported onboarding action." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onboarding update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
