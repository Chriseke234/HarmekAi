import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptSecret, maskSecret } from "@/lib/security/crypto";
import { getEnhancedProvider } from "@/lib/intelligence/providers/adapters";
import { createTrialActivationWindow } from "@/lib/billing/trial";

const UpdateAssistantSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  is_active: z.boolean().optional(),
  tone: z
    .enum(["friendly", "professional", "conversational", "luxury", "supportive", "custom"])
    .optional(),
  custom_tone_notes: z.string().max(500).optional(),
  formality: z.enum(["casual", "balanced", "formal"]).optional(),
  response_length: z.enum(["brief", "concise", "detailed"]).optional(),
  welcome_message: z.string().min(1).max(500).optional(),
  supported_languages: z.array(z.string()).optional(),
  business_objectives: z.string().max(1000).optional(),
  allowed_topics: z.array(z.string()).optional(),
  avoided_topics: z.array(z.string()).optional(),
  escalation_keywords: z.array(z.string()).optional(),
  clarification_enabled: z.boolean().optional(),
  auto_answer_threshold: z.number().min(0.2).max(0.95).optional(),
  clarification_threshold: z.number().min(0.1).max(0.8).optional(),
  max_consecutive_fallbacks: z.number().int().min(1).max(5).optional(),
  intelligence_mode: z.enum(["native", "enhanced"]).optional(),
  enhanced_provider: z.enum(["openai", "anthropic", "gemini"]).nullable().optional(),
  enhanced_model: z.string().max(80).nullable().optional(),
  api_key_plaintext: z.string().max(300).optional(),
  test_provider_connection: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const workspaceId = auth.context.workspace.id;

  const [{ data: assistant }, { data: settings }, { data: credentials }] = await Promise.all([
    supabase.from("assistants").select("*").eq("workspace_id", workspaceId).single(),
    supabase.from("assistant_settings").select("*").eq("workspace_id", workspaceId).single(),
    admin
      .from("workspace_ai_credentials")
      .select("provider, key_last_four, is_verified, last_verified_at")
      .eq("workspace_id", workspaceId),
  ]);

  return NextResponse.json({
    assistant,
    settings,
    configuredProviders: credentials ?? [],
  });
}

export async function PATCH(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = UpdateAssistantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid assistant configuration." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    const workspaceId = auth.context.workspace.id;

    // Optional Enhanced AI connection test
    if (d.test_provider_connection && d.enhanced_provider && d.api_key_plaintext) {
      const provider = getEnhancedProvider(d.enhanced_provider);
      const testResult = await provider.testConnection(
        d.api_key_plaintext.trim(),
        d.enhanced_model
      );
      if (testResult.ok) {
        await admin.from("workspace_ai_credentials").upsert(
          {
            workspace_id: workspaceId,
            provider: d.enhanced_provider,
            encrypted_api_key: encryptSecret(d.api_key_plaintext.trim()),
            key_last_four: maskSecret(d.api_key_plaintext.trim()),
            is_verified: true,
            last_verified_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id,provider" }
        );
      }
      return NextResponse.json({ testResult });
    }

    // Encrypt and store optional API key server-side
    if (d.api_key_plaintext && d.enhanced_provider) {
      await admin.from("workspace_ai_credentials").upsert(
        {
          workspace_id: workspaceId,
          provider: d.enhanced_provider,
          encrypted_api_key: encryptSecret(d.api_key_plaintext.trim()),
          key_last_four: maskSecret(d.api_key_plaintext.trim()),
          is_verified: false,
        },
        { onConflict: "workspace_id,provider" }
      );
    }

    // Update assistant record
    const assistantPatch: Record<string, unknown> = {};
    if (d.name !== undefined) assistantPatch.name = d.name;
    if (d.is_active !== undefined) {
      assistantPatch.is_active = d.is_active;
      if (d.is_active) {
        assistantPatch.activated_at = new Date().toISOString();
        const { data: trial } = await supabase
          .from("trial_records")
          .select("*")
          .eq("workspace_id", workspaceId)
          .maybeSingle();
        if (trial && trial.status === "not_started") {
          await supabase
            .from("trial_records")
            .update(createTrialActivationWindow(trial.duration_days ?? 14))
            .eq("workspace_id", workspaceId);
        }
      }
    }
    if (Object.keys(assistantPatch).length > 0) {
      await supabase.from("assistants").update(assistantPatch).eq("workspace_id", workspaceId);
    }

    // Update settings record
    const {
      name: _n,
      is_active: _a,
      api_key_plaintext: _k,
      test_provider_connection: _t,
      ...settingsPatch
    } = d;

    if (Object.keys(settingsPatch).length > 0) {
      await supabase
        .from("assistant_settings")
        .update(settingsPatch)
        .eq("workspace_id", workspaceId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update assistant.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
