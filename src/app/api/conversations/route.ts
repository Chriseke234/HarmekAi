import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("conversations")
    .select("*, contacts(id, full_name, email, phone)")
    .eq("workspace_id", auth.context.workspace.id)
    .neq("channel", "simulator")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let conversations = data ?? [];
  if (search) {
    conversations = conversations.filter((c) => {
      const contact = c.contacts as { full_name?: string; email?: string } | null;
      return (
        (contact?.full_name ?? "").toLowerCase().includes(search) ||
        (contact?.email ?? "").toLowerCase().includes(search) ||
        (c.summary ?? "").toLowerCase().includes(search) ||
        (c.category ?? "").toLowerCase().includes(search)
      );
    });
  }

  return NextResponse.json({ conversations });
}
