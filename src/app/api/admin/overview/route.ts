import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/security/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createSupabaseAdminClient();

  const [workspacesRes, assistantsRes, trialsRes, subsRes, usageRes, errorsRes, intRes] =
    await Promise.all([
      admin
        .from("workspaces")
        .select("id, name, slug, onboarding_completed, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      admin.from("assistants").select("id, workspace_id, is_active, activated_at"),
      admin.from("trial_records").select("workspace_id, status, expires_at, activated_at"),
      admin.from("subscription_records").select("workspace_id, plan_tier, status"),
      admin
        .from("usage_records")
        .select("intelligence_mode, quantity, tokens_used, estimated_cost_usd")
        .limit(5000),
      admin
        .from("system_error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      admin.from("integrations").select("provider, status"),
    ]);

  const usage = usageRes.data ?? [];
  const totalNativeMessages = usage
    .filter((u) => u.intelligence_mode === "native")
    .reduce((acc, u) => acc + (u.quantity ?? 0), 0);
  const totalEnhancedMessages = usage
    .filter((u) => u.intelligence_mode === "enhanced")
    .reduce((acc, u) => acc + (u.quantity ?? 0), 0);
  const totalEstimatedProviderCostUsd = usage.reduce(
    (acc, u) => acc + Number(u.estimated_cost_usd ?? 0),
    0
  );

  return NextResponse.json({
    health: {
      status: "operational",
      supabaseConnected: true,
      checkedAt: new Date().toISOString(),
    },
    counts: {
      registeredWorkspaces: (workspacesRes.data ?? []).length,
      activeAssistants: (assistantsRes.data ?? []).filter((a) => a.is_active).length,
      activeTrials: (trialsRes.data ?? []).filter((t) => t.status === "active").length,
      paidSubscriptions: (subsRes.data ?? []).filter((s) => s.status === "active").length,
      totalNativeMessages,
      totalEnhancedMessages,
      totalEstimatedProviderCostUsd: Number(totalEstimatedProviderCostUsd.toFixed(4)),
    },
    workspaces: workspacesRes.data ?? [],
    trials: trialsRes.data ?? [],
    integrations: intRes.data ?? [],
    recentErrors: errorsRes.data ?? [],
  });
}
