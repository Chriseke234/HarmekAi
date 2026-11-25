import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_AUTOMATION_TEMPLATES } from "@/lib/automations/engine";
import { slugify } from "@/lib/utils";
import type { Workspace } from "@/types/database";

/**
 * Creates a brand-new isolated business workspace with all required baseline records:
 * - workspace + owner membership
 * - business_profile
 * - assistant + assistant_settings (Native Harmek Engine by default)
 * - trial_record (status = 'not_started' until assistant activation)
 * - subscription_record
 * - default guided automations
 * - default integration records (website_widget ready, social channels disconnected)
 */
export async function bootstrapWorkspaceForUser(params: {
  userId: string;
  businessName: string;
  industry?: string;
  description?: string;
}): Promise<Workspace> {
  const admin = createSupabaseAdminClient();
  const baseSlug = slugify(params.businessName);
  const uniqueSuffix = Math.random().toString(36).slice(2, 7);
  const slug = `${baseSlug}-${uniqueSuffix}`;

  const { data: workspace, error: wsError } = await admin
    .from("workspaces")
    .insert({
      owner_id: params.userId,
      name: params.businessName.trim(),
      slug,
      onboarding_completed: false,
      onboarding_step: 2,
    })
    .select("*")
    .single<Workspace>();

  if (wsError || !workspace) {
    throw new Error(wsError?.message ?? "Failed to create workspace.");
  }

  await admin.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: params.userId,
    role: "owner",
  });

  await admin.from("business_profiles").insert({
    workspace_id: workspace.id,
    business_name: params.businessName.trim(),
    industry: params.industry?.trim() || "General",
    description: params.description?.trim() || "",
  });

  const { data: assistant, error: asstError } = await admin
    .from("assistants")
    .insert({
      workspace_id: workspace.id,
      name: "Harmek",
      is_active: false,
    })
    .select("id")
    .single<{ id: string }>();

  if (asstError || !assistant) {
    throw new Error(asstError?.message ?? "Failed to initialize assistant.");
  }

  await admin.from("assistant_settings").insert({
    workspace_id: workspace.id,
    assistant_id: assistant.id,
    intelligence_mode: "native",
    welcome_message: `Hello! Welcome to ${params.businessName.trim()}. How can I help you today?`,
  });

  // 14-day trial starts ONLY when the assistant is activated
  await admin.from("trial_records").insert({
    workspace_id: workspace.id,
    status: "not_started",
    duration_days: 14,
    conversation_limit: 500,
    message_limit: 2500,
  });

  await admin.from("subscription_records").insert({
    workspace_id: workspace.id,
    plan_tier: "trial",
    status: "trialing",
  });

  await admin.from("automations").insert(
    DEFAULT_AUTOMATION_TEMPLATES.map((tpl) => ({
      workspace_id: workspace.id,
      ...tpl,
    }))
  );

  await admin.from("integrations").insert([
    {
      workspace_id: workspace.id,
      provider: "website_widget",
      status: "connected",
      verified_at: new Date().toISOString(),
      public_config: { widget_key: workspace.widget_key },
    },
    { workspace_id: workspace.id, provider: "whatsapp", status: "disconnected" },
    { workspace_id: workspace.id, provider: "instagram", status: "disconnected" },
    { workspace_id: workspace.id, provider: "messenger", status: "disconnected" },
    { workspace_id: workspace.id, provider: "webhook", status: "disconnected" },
  ]);

  return workspace;
}
