import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Cpu,
  MessageSquare,
  Plug,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { requirePlatformAdmin } from "@/lib/security/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HarmekLogo } from "@/components/brand/harmek-logo";
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
  const [
    workspacesRes,
    profilesRes,
    assistantsRes,
    trialsRes,
    subsRes,
    usageRes,
    convRes,
    integrationsRes,
    errorsRes,
  ] = await Promise.all([
    admin
      .from("workspaces")
      .select("id, name, slug, onboarding_completed, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("profiles").select("id, email, full_name, created_at").limit(200),
    admin.from("assistants").select("id, workspace_id, name, is_active, activated_at"),
    admin.from("trial_records").select("workspace_id, status, expires_at, activated_at"),
    admin.from("subscription_records").select("workspace_id, plan_tier, status"),
    admin
      .from("usage_records")
      .select("intelligence_mode, quantity, tokens_used, estimated_cost_usd")
      .limit(5000),
    admin.from("conversations").select("id, channel, status, human_takeover").limit(5000),
    admin.from("integrations").select("workspace_id, provider, status"),
    admin
      .from("system_error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const workspaces = workspacesRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const assistants = assistantsRes.data ?? [];
  const trials = trialsRes.data ?? [];
  const subs = subsRes.data ?? [];
  const usage = usageRes.data ?? [];
  const conversations = convRes.data ?? [];
  const integrations = integrationsRes.data ?? [];
  const errors = errorsRes.data ?? [];

  const nativeMsgs = usage
    .filter((u) => u.intelligence_mode === "native")
    .reduce((acc, u) => acc + (u.quantity ?? 0), 0);
  const enhancedMsgs = usage
    .filter((u) => u.intelligence_mode === "enhanced")
    .reduce((acc, u) => acc + (u.quantity ?? 0), 0);
  const estCost = usage.reduce((acc, u) => acc + Number(u.estimated_cost_usd ?? 0), 0);
  const whatsappConnected = integrations.filter(
    (i) => i.provider === "whatsapp" && i.status === "connected"
  ).length;
  const whatsappPending = integrations.filter(
    (i) => i.provider === "whatsapp" && i.status === "pending_verification"
  ).length;

  const trialMap = new Map(trials.map((t) => [t.workspace_id, t]));
  const assistantMap = new Map(assistants.map((a) => [a.workspace_id, a]));
  const subMap = new Map(subs.map((s) => [s.workspace_id, s]));

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#262626] pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <HarmekLogo className="h-10 w-10" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-normal text-[#FAFAFA]">
                  Harmek AI — Owner Admin Console
                </h1>
                <Badge variant="warning">
                  <Shield className="h-3 w-3" />
                  Platform Admin
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-[#8F8F8F]">
                Cross-tenant operations, trial tracking, AI engine telemetry, and channel
                health.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3" />
              System Operational
            </Badge>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" />
                My Workspace
              </Button>
            </Link>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#A3A3A3]">Registered Workspaces / Users</p>
                <p className="mt-1.5 font-display text-3xl tabular-nums text-[#FAFAFA]">
                  {workspaces.length}{" "}
                  <span className="text-lg text-[#8F8F8F]">/ {profiles.length}</span>
                </p>
              </div>
              <Building2 className="h-5 w-5 text-[#FFFFFF]" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#A3A3A3]">Active Assistants / Active Trials</p>
                <p className="mt-1.5 font-display text-3xl tabular-nums text-[#FAFAFA]">
                  {assistants.filter((a) => a.is_active).length}{" "}
                  <span className="text-lg text-[#D4D4D4]">
                    / {trials.filter((t) => t.status === "active").length}
                  </span>
                </p>
              </div>
              <Activity className="h-5 w-5 text-[#D4D4D4]" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#A3A3A3]">Total Conversations Across Platform</p>
                <p className="mt-1.5 font-display text-3xl tabular-nums text-[#FAFAFA]">
                  {conversations.length}
                </p>
              </div>
              <MessageSquare className="h-5 w-5 text-[#FFFFFF]" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#A3A3A3]">Native / Enhanced AI Messages</p>
                <p className="mt-1.5 font-display text-3xl tabular-nums text-[#FAFAFA]">
                  {nativeMsgs}{" "}
                  <span className="text-lg text-[#8F8F8F]">/ {enhancedMsgs}</span>
                </p>
              </div>
              <Cpu className="h-5 w-5 text-[#D4D4D4]" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#A3A3A3]">Paid Subscriptions / Est. LLM Cost</p>
                <p className="mt-1.5 font-display text-3xl tabular-nums text-[#FAFAFA]">
                  {subs.filter((s) => s.status === "active").length}{" "}
                  <span className="text-lg text-[#FFFFFF]">/ ${estCost.toFixed(4)}</span>
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-[#FFFFFF]" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-[#A3A3A3]">WhatsApp Connected / Pending</p>
                <p className="mt-1.5 font-display text-3xl tabular-nums text-[#FAFAFA]">
                  {whatsappConnected}{" "}
                  <span className="text-lg text-[#8F8F8F]">/ {whatsappPending}</span>
                </p>
              </div>
              <Plug className="h-5 w-5 text-[#D4D4D4]" />
            </CardContent>
          </Card>
        </div>

        {/* Workspaces Table & System Logs */}
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#FFFFFF]" />
                Tenant Workspaces ({workspaces.length})
              </CardTitle>
              <CardDescription>
                Live view of every business workspace, assistant activation, and trial status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {workspaces.length === 0 ? (
                <p className="text-sm text-[#8F8F8F]">No workspaces registered yet.</p>
              ) : (
                workspaces.map((w) => {
                  const t = trialMap.get(w.id);
                  const a = assistantMap.get(w.id);
                  const s = subMap.get(w.id);
                  return (
                    <div
                      key={w.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#262626] bg-[#0E0E0E] px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-[#FAFAFA]">{w.name}</p>
                        <p className="font-mono text-[11px] text-[#8F8F8F]">
                          {w.slug} &bull; Created {formatRelativeTime(w.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={a?.is_active ? "success" : "secondary"}>
                          {a?.is_active ? "Active" : "Draft"}
                        </Badge>
                        <Badge variant={t?.status === "active" ? "default" : "outline"}>
                          Trial: {t?.status?.replace(/_/g, " ") || "not started"}
                        </Badge>
                        <Badge variant="secondary">{s?.plan_tier || "trial"}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#D9A05B]" />
                System &amp; AI Fallback Logs
              </CardTitle>
              <CardDescription>
                Recent provider fallbacks, fact-verifier blocks, and runtime warnings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {errors.length === 0 ? (
                <p className="text-sm text-[#8F8F8F]">
                  No system errors or fallback warnings recorded.
                </p>
              ) : (
                errors.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-lg border border-[#262626] bg-[#0E0E0E] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-[#FAFAFA]">
                        {e.component}
                      </span>
                      <Badge variant={e.severity === "critical" ? "destructive" : "warning"}>
                        {e.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[#A3A3A3]">{e.message}</p>
                    <p className="mt-1 text-[10px] text-[#8F8F8F]">
                      {formatRelativeTime(e.created_at)}
                    </p>
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
