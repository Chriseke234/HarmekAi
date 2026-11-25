import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { loadWorkspaceIntelligenceContext } from "@/lib/conversations/processor";
import { routeIntelligenceRequest } from "@/lib/intelligence/router";
import type { ConversationStateContext } from "@/types/database";

const SimulateSchema = z.object({
  message: z.string().min(1).max(1500),
  stateContext: z.record(z.string(), z.unknown()).optional(),
  recentHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

export async function POST(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = SimulateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Message is required." },
        { status: 400 }
      );
    }

    const ctx = await loadWorkspaceIntelligenceContext(auth.context.workspace.id);
    if (!ctx.assistant || !ctx.settings) {
      return NextResponse.json(
        { error: "Assistant is not initialized for this workspace." },
        { status: 400 }
      );
    }

    const result = await routeIntelligenceRequest({
      message: parsed.data.message,
      assistant: ctx.assistant,
      settings: ctx.settings,
      knowledge: ctx.knowledge,
      conversation: {
        status: "ai_handling",
        human_takeover: false,
        state_context: (parsed.data.stateContext ?? {}) as ConversationStateContext,
      },
      recentHistory: parsed.data.recentHistory ?? [],
      enhancedApiKey: ctx.enhancedApiKey,
      isSimulator: true,
    });

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
