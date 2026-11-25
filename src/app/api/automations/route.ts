import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ToggleSchema = z.object({
  id: z.string().uuid(),
  is_enabled: z.boolean(),
});

export async function GET() {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createSupabaseServerClient();
  const workspaceId = auth.context.workspace.id;

  const [rulesRes, execRes] = await Promise.all([
    supabase
      .from("automations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("automation_executions")
      .select("*, automations(name)")
      .eq("workspace_id", workspaceId)
      .order("executed_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    automations: rulesRes.data ?? [],
    executions: execRes.data ?? [],
  });
}

export async function PATCH(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = ToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid automation toggle." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("automations")
    .update({ is_enabled: parsed.data.is_enabled })
    .eq("id", parsed.data.id)
    .eq("workspace_id", auth.context.workspace.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ automation: data });
}
