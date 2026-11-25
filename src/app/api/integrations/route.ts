import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UpdateIntegrationSchema = z.object({
  provider: z.enum(["website_widget", "whatsapp", "instagram", "messenger", "webhook"]),
  public_config: z.record(z.string(), z.unknown()).default({}),
  widget_primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  widget_position: z.enum(["bottom-right", "bottom-left"]).optional(),
  widget_require_consent: z.boolean().optional(),
  welcome_message: z.string().min(1).max(500).optional(),
});

export async function GET() {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createSupabaseServerClient();
  const workspaceId = auth.context.workspace.id;

  const [intRes, settingsRes] = await Promise.all([
    supabase.from("integrations").select("*").eq("workspace_id", workspaceId),
    supabase
      .from("assistant_settings")
      .select("widget_primary_color, widget_position, widget_require_consent, welcome_message")
      .eq("workspace_id", workspaceId)
      .single(),
  ]);

  return NextResponse.json({
    widgetKey: auth.context.workspace.widget_key,
    integrations: intRes.data ?? [],
    widgetSettings: settingsRes.data ?? null,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = UpdateIntegrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid integration update." },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const workspaceId = auth.context.workspace.id;

  if (d.provider === "website_widget") {
    const patch: Record<string, unknown> = {};
    if (d.widget_primary_color) patch.widget_primary_color = d.widget_primary_color;
    if (d.widget_position) patch.widget_position = d.widget_position;
    if (d.widget_require_consent !== undefined) {
      patch.widget_require_consent = d.widget_require_consent;
    }
    if (d.welcome_message) patch.welcome_message = d.welcome_message;
    if (Object.keys(patch).length > 0) {
      await supabase.from("assistant_settings").update(patch).eq("workspace_id", workspaceId);
    }
    return NextResponse.json({ ok: true });
  }

  // External channels are NEVER marked 'connected' until official verification succeeds.
  const { data, error } = await supabase
    .from("integrations")
    .upsert(
      {
        workspace_id: workspaceId,
        provider: d.provider,
        status: "pending_verification",
        public_config: d.public_config,
        last_error: null,
      },
      { onConflict: "workspace_id,provider" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    integration: data,
    notice:
      "Configuration saved as Pending Verification. Connect your official platform webhook and credentials to complete verification.",
  });
}
