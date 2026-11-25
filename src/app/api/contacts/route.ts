import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UpdateContactSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().max(120).nullable().optional(),
  email: z.string().email().nullable().or(z.literal("")).optional(),
  phone: z.string().max(50).nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("workspace_id", auth.context.workspace.id)
    .order("last_interaction_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ contacts: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = UpdateContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid contact update." },
      { status: 400 }
    );
  }

  const { id, ...updates } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("contacts")
    .update({
      ...updates,
      email: updates.email === "" ? null : updates.email,
    })
    .eq("id", id)
    .eq("workspace_id", auth.context.workspace.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ contact: data });
}
