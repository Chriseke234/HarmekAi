import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const InviteSchema = z.object({
  email: z.string().email("Valid email address is required."),
  role: z.enum(["admin", "agent"]),
});

const RoleUpdateSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["admin", "agent"]),
});

export async function GET() {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createSupabaseServerClient();
  const workspaceId = auth.context.workspace.id;

  const [membersRes, invitesRes] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("id, role, created_at, profiles(id, full_name, email)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("workspace_invitations")
      .select("id, email, role, status, expires_at, created_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    currentRole: auth.context.role,
    members: membersRes.data ?? [],
    invitations: invitesRes.data ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid invitation." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspace_invitations")
    .insert({
      workspace_id: auth.context.workspace.id,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      invited_by: auth.context.userId,
    })
    .select("id, email, role, status, expires_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ invitation: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireWorkspaceAccess(["owner"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = RoleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role update." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("workspace_members")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.memberId)
    .eq("workspace_id", auth.context.workspace.id)
    .neq("role", "owner");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
