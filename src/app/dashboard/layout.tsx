import { redirect } from "next/navigation";
import { getAuthenticatedContext, isAuthorizedPlatformOwnerEmail } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateTrialStatus } from "@/lib/billing/trial";
import { DashboardShell } from "@/components/dashboard/shell";
import type { IntelligenceMode, TrialRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) redirect("/sign-in");
  if (!ctx.workspace) redirect("/onboarding");

  const supabase = await createSupabaseServerClient();
  const [{ data: settings }, { data: trial }] = await Promise.all([
    supabase
      .from("assistant_settings")
      .select("intelligence_mode")
      .eq("workspace_id", ctx.workspace.id)
      .maybeSingle(),
    supabase
      .from("trial_records")
      .select("*")
      .eq("workspace_id", ctx.workspace.id)
      .maybeSingle<TrialRecord>(),
  ]);

  const trialSummary = evaluateTrialStatus(trial ?? null);

  return (
    <DashboardShell
      workspaceName={ctx.workspace.name}
      userEmail={ctx.email}
      intelligenceMode={(settings?.intelligence_mode as IntelligenceMode) ?? "native"}
      trialStatus={trialSummary.status}
      trialDaysRemaining={trialSummary.daysRemaining}
      isPlatformAdmin={
        Boolean(ctx.profile?.is_platform_admin) && isAuthorizedPlatformOwnerEmail(ctx.email)
      }
    >
      {children}
    </DashboardShell>
  );
}
