import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Cpu,
  Shield,
  Sparkles,
} from "lucide-react";
import { requirePlatformAdmin } from "@/lib/security/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    if (auth.status === 401) redirect("/sign-in");
    redirect("/dashboard");
  }

  const admin = createSupabaseAdminClient();
  const [workspacesRes, assistantsRes, trialsRes, subsRes, usageRes, errorsRes] =
    await Promise.all([
      admin
        .from("workspaces")
        .select("id, name, slug, onboarding_completed, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      admin.from("assistants").select("id, is_active"),
      admin.from("trial_records").select("id, status"),
      admin.from("subscription_records").select("id, status"),
      admin
        .from("usage_records")
        .select("intelligence_mode, quantity, estimated_cost_usd")
        .limit(5000),
      admin
        .from("system_error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const workspaces = workspacesRes.data ?? [];
  const assistants = assistantsRes.data ?? [];
  const trials = trialsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const usage = usageRes.data ?? [];
  const errors = errorsRes.data ?? [];

  const nativeMsgs = usage
    .filter((u) => u.intelligence_mode === "native")
    .reduce((acc, u) => acc + (u.quantity ?? 0), 0);
  const enhancedMsgs = usage
    .filter((u) => u.intelligence_mode === "enhanced")
    .reduce((acc, u) => acc + (u.quantity ?? 0), 0);
  const estCost = usage.reduce((acc, u) => acc + Number(u.estimated_cost_usd ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#11100E] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#2B2722] pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Harmek AI Platform Administration</h1>
              <p className="text-xs text-[#B5AEA2]">
                Isolated platform-owner monitoring layer — inaccessible to normal business
                workspaces.
              </p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Workspace
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#B5AEA2]">Registered Workspaces</p>
                <p className="mt-1 text-2xl font-bold text-white">{workspaces.length}</p>
              </div>
              <Building2 className="h-5 w-5 text-[#D97745]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#B5AEA2]">Active Assistants / Active Trials</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {assistants.filter((a) => a.is_active).length} /{" "}
                  {trials.filter((t) => t.status === "active").length}
                </p>
              </div>
              <Activity className="h-5 w-5 text-emerald-400" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#B5AEA2]">Native / Enhanced Messages</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {nativeMsgs} / {enhancedMsgs}
                </p>
              </div>
              <Cpu className="h-5 w-5 text-[#D97745]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#B5AEA2]">Paid Subs / Est. LLM Cost</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {subs.filter((s) => s.status === "active").length} / ${estCost.toFixed(4)}
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-amber-400" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Registered Workspaces</CardTitle>
              <CardDescription>Most recent tenant workspaces on Harmek AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {workspaces.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-lg border border-[#2B2722] bg-[#141210] px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">{w.name}</p>
                    <p className="text-xs text-[#B5AEA2]">
                      {w.slug} &bull; Created {formatRelativeTime(w.created_at)}
                    </p>
                  </div>
                  <Badge variant={w.onboarding_completed ? "success" : "secondary"}>
                    {w.onboarding_completed ? "Onboarded" : "In Setup"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                System &amp; Provider Logs
              </CardTitle>
              <CardDescription>Recent warnings, fallbacks, and error events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {errors.length === 0 ? (
                <p className="text-sm text-[#B5AEA2]">No recent system errors recorded.</p>
              ) : (
                errors.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-lg border border-[#2B2722] bg-[#141210] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F5F2EB]">{e.component}</span>
                      <Badge variant={e.severity === "critical" ? "destructive" : "warning"}>
                        {e.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[#B5AEA2]">{e.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
