import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceAccess } from "@/lib/security/auth";
import { loadWorkspaceIntelligenceContext } from "@/lib/conversations/processor";
import { routeIntelligenceRequest } from "@/lib/intelligence/router";

const EvalSchema = z.object({
  cases: z
    .array(
      z.object({
        question: z.string().min(2).max(400),
        expectedKeyword: z.string().min(1).max(160),
      })
    )
    .min(1)
    .max(25),
});

/**
 * Built-In Golden Test Suite ("Accuracy Check").
 * Runs owner-defined customer questions against the workspace's live Knowledge Base
 * and reports an honest pass/fail accuracy score before deploying changes.
 */
export async function POST(request: Request) {
  const auth = await requireWorkspaceAccess(["owner", "admin", "agent"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = EvalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Provide at least one test case." },
        { status: 400 }
      );
    }

    const ctx = await loadWorkspaceIntelligenceContext(auth.context.workspace.id);
    if (!ctx.assistant || !ctx.settings) {
      return NextResponse.json({ error: "Assistant not initialized." }, { status: 400 });
    }

    const results = [];
    let passedCount = 0;

    for (const tc of parsed.data.cases) {
      const out = await routeIntelligenceRequest({
        message: tc.question,
        assistant: ctx.assistant,
        settings: ctx.settings,
        knowledge: ctx.knowledge,
        enhancedApiKey: ctx.enhancedApiKey,
        isSimulator: true,
      });

      const reply = out.reply ?? "";
      const passed = reply.toLowerCase().includes(tc.expectedKeyword.trim().toLowerCase());
      if (passed) passedCount += 1;

      results.push({
        question: tc.question,
        expectedKeyword: tc.expectedKeyword,
        reply,
        passed,
        confidence: out.confidence,
        modeUsed: out.intelligenceModeUsed,
        intent: out.intent,
      });
    }

    const accuracyPercent = Math.round((passedCount / results.length) * 100);
    return NextResponse.json({
      total: results.length,
      passed: passedCount,
      accuracyPercent,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Accuracy evaluation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
