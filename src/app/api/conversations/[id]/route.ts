import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAgentHandoffBrief,
  extractFaqDraftFromResolution,
} from "@/lib/intelligence/native/engine";
import type { Message } from "@/types/database";

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send_agent_message"),
    content: z.string().min(1).max(4000),
  }),
  z.object({
    action: z.literal("take_over"),
  }),
  z.object({
    action: z.literal("return_to_ai"),
  }),
  z.object({
    action: z.literal("update_status"),
    status: z.enum(["open", "ai_handling", "waiting_for_human", "assigned", "resolved"]),
  }),
  z.object({
    action: z.literal("assign_agent"),
    assigned_to: z.string().uuid().nullable(),
  }),
  z.object({
    action: z.literal("add_internal_note"),
    content: z.string().min(1).max(2000),
  }),
  z.object({
    action: z.literal("mark_sale_completed"),
    sale_completed: z.boolean(),
  }),
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const workspaceId = auth.context.workspace.id;

  const [convRes, msgRes, notesRes] = await Promise.all([
    supabase
      .from("conversations")
      .select("*, contacts(*)")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single(),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("internal_notes")
      .select("*, profiles(full_name, email)")
      .eq("conversation_id", id)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  if (convRes.error || !convRes.data) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  // Reset unread indicator when opened by a team member
  if ((convRes.data.unread_count ?? 0) > 0) {
    await supabase
      .from("conversations")
      .update({ unread_count: 0 })
      .eq("id", id)
      .eq("workspace_id", workspaceId);
  }

  const messages = (msgRes.data ?? []) as Message[];
  const handoffBrief = buildAgentHandoffBrief(messages, auth.context.workspace.name);
  const suggestedFaqDraft = extractFaqDraftFromResolution(messages);

  return NextResponse.json({
    conversation: convRes.data,
    messages,
    notes: notesRes.data ?? [],
    handoffBrief,
    suggestedFaqDraft,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const workspaceId = auth.context.workspace.id;

  try {
    const body = await request.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid conversation action." },
        { status: 400 }
      );
    }

    const d = parsed.data;

    if (d.action === "send_agent_message") {
      // Sending a human message automatically enforces human_takeover = true
      const { data: msg, error } = await supabase
        .from("messages")
        .insert({
          workspace_id: workspaceId,
          conversation_id: id,
          sender_type: "agent",
          sender_id: auth.context.userId,
          content: d.content.trim(),
        })
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      await supabase
        .from("conversations")
        .update({
          human_takeover: true,
          status: "assigned",
          assigned_to: auth.context.userId,
          unread_count: 0,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      return NextResponse.json({ message: msg });
    }

    if (d.action === "take_over") {
      await supabase
        .from("conversations")
        .update({
          human_takeover: true,
          status: "assigned",
          assigned_to: auth.context.userId,
        })
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      await supabase.from("messages").insert({
        workspace_id: workspaceId,
        conversation_id: id,
        sender_type: "system",
        sender_id: auth.context.userId,
        content: "A team member has taken over this conversation. Automated AI replies are paused.",
      });

      return NextResponse.json({ ok: true });
    }

    if (d.action === "return_to_ai") {
      await supabase
        .from("conversations")
        .update({
          human_takeover: false,
          status: "ai_handling",
        })
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      await supabase.from("messages").insert({
        workspace_id: workspaceId,
        conversation_id: id,
        sender_type: "system",
        sender_id: auth.context.userId,
        content: "Conversation returned to Harmek AI automated handling.",
      });

      return NextResponse.json({ ok: true });
    }

    if (d.action === "update_status") {
      await supabase
        .from("conversations")
        .update({
          status: d.status,
          human_takeover:
            d.status === "ai_handling"
              ? false
              : d.status === "assigned" || d.status === "waiting_for_human"
                ? true
                : undefined,
        })
        .eq("id", id)
        .eq("workspace_id", workspaceId);
      return NextResponse.json({ ok: true });
    }

    if (d.action === "assign_agent") {
      await supabase
        .from("conversations")
        .update({
          assigned_to: d.assigned_to,
          status: d.assigned_to ? "assigned" : "open",
          human_takeover: Boolean(d.assigned_to),
        })
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      await supabase.from("conversation_assignments").insert({
        workspace_id: workspaceId,
        conversation_id: id,
        assigned_to: d.assigned_to,
        assigned_by: auth.context.userId,
      });
      return NextResponse.json({ ok: true });
    }

    if (d.action === "add_internal_note") {
      const { data: note, error } = await supabase
        .from("internal_notes")
        .insert({
          workspace_id: workspaceId,
          conversation_id: id,
          author_id: auth.context.userId,
          content: d.content.trim(),
        })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ note });
    }

    if (d.action === "mark_sale_completed") {
      await supabase
        .from("conversations")
        .update({ sale_completed: d.sale_completed })
        .eq("id", id)
        .eq("workspace_id", workspaceId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversation action failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
