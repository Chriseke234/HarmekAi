import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  UserCheck,
  Users,
} from "lucide-react";
import { getAuthenticatedContext } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateTrialStatus } from "@/lib/billing/trial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EmberFox } from "@/components/brand/ember-fox";
import { formatRelativeTime } from "@/lib/utils";
import type { TrialRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const ctx = await getAuthenticatedContext();
  if (!ctx?.workspace) return null;

  const supabase = await createSupabaseServerClient();
  const workspaceId = ctx.workspace.id;

  const [convRes, unansweredRes, assistantRes, trialRes] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, status, human_takeover, lead_captured, summary, last_message_at, channel")
      .eq("workspace_id", workspaceId)
      .neq("channel", "simulator")
      .order("last_message_at", { ascending: false })
      .limit(50),
    supabase
      .from("unanswered_questions")
      .select("id, question, created_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("assistants")
      .select("name, is_active")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    supabase
      .from("trial_records")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle<TrialRecord>(),
  ]);

  const conversations = convRes.data ?? [];
  const unanswered = unansweredRes.data ?? [];
  const trialSummary = evaluateTrialStatus(trialRes.data ?? null);

  const totalConversations = conversations.length;
  const aiHandled = conversations.filter((c) => !c.human_takeover).length;
  const humanHandled = conversations.filter((c) => c.human_takeover).length;
  const escalated = conversations.filter(
    (c) => c.status === "waiting_for_human" || c.human_takeover
  ).length;
  const leadsCaptured = conversations.filter((c) => c.lead_captured).length;

  const stats = [
    { label: "Total Conversations", value: totalConversations, icon: MessageSquare },
    { label: "AI-Handled", value: aiHandled, icon: Bot },
    { label: "Human-Handled", value: humanHandled, icon: UserCheck },
    { label: "Escalated", value: escalated, icon: AlertTriangle },
    { label: "Unanswered Questions", value: unanswered.length, icon: HelpCircle },
    { label: "Leads Captured", value: leadsCaptured, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Overview</h1>
          <p className="mt-1 text-sm text-[#B5AEA2]">
            Real-time customer engagement activity for {ctx.workspace.name}.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {!assistantRes.data?.is_active ? (
            <Link href="/onboarding">
              <Button>
                Complete Setup &amp; Activate
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/conversations">
              <Button variant="secondary">Open Inbox</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Trial Status Banner */}
      <Card className="border-[#D97745]/30 bg-gradient-to-r from-[#181613] to-[#211E1A]">
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <EmberFox
              mood={assistantRes.data?.is_active ? "celebrating" : "listening"}
              size={46}
            />
            <div>
              <p className="text-sm font-semibold text-white">
                {trialSummary.status === "not_started"
                  ? "14-Day Free Trial Ready — Starts When You Activate Sage"
                  : trialSummary.status === "active"
                    ? `14-Day Free Trial Active — ${trialSummary.daysRemaining} day${
                        trialSummary.daysRemaining === 1 ? "" : "s"
                      } remaining`
                    : trialSummary.status === "expired"
                      ? "Your 14-Day Trial Has Ended — Review Your Performance Report"
                      : "Subscription Active"}
              </p>
              <p className="text-xs text-[#B5AEA2]">
                Assistant status:{" "}
                {assistantRes.data?.is_active ? "Active and ready" : "Inactive (draft mode)"}
              </p>
            </div>
          </div>
          <Link href="/dashboard/billing">
            <Button variant="outline" size="sm">
              Trial &amp; Report
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-medium text-[#B5AEA2]">{item.label}</p>
                  <p className="mt-1.5 text-2xl font-bold text-white">{item.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2B2722] bg-[#211E1A] text-[#D97745]">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity & Knowledge Gaps */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Latest customer chats from your live channels.</CardDescription>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-5 w-5" />}
                title="No customer conversations yet"
                description="Install the website chat widget or test your assistant in the AI Assistant tab."
                action={
                  <Link href="/dashboard/integrations">
                    <Button size="sm">Get Widget Script</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {conversations.slice(0, 5).map((conv) => (
                  <Link
                    key={conv.id}
                    href="/dashboard/conversations"
                    className="flex items-center justify-between rounded-lg border border-[#2B2722] bg-[#141210] p-3.5 transition-colors hover:border-[#3D3730]"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="truncate text-sm font-medium text-[#F5F2EB]">
                        {conv.summary || "Website customer enquiry"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#B5AEA2]">
                        {formatRelativeTime(conv.last_message_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        conv.status === "waiting_for_human"
                          ? "warning"
                          : conv.status === "resolved"
                            ? "success"
                            : "secondary"
                      }
                    >
                      {conv.status.replace(/_/g, " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unanswered Questions (Knowledge Gaps)</CardTitle>
            <CardDescription>
              Questions Harmek could not answer with high confidence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unanswered.length === 0 ? (
              <EmptyState
                icon={<HelpCircle className="h-5 w-5" />}
                title="No open knowledge gaps"
                description="Whenever a customer asks something outside your Knowledge Base, Harmek logs it here for your review."
              />
            ) : (
              <div className="space-y-2.5">
                {unanswered.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between rounded-lg border border-[#2B2722] bg-[#141210] p-3 text-sm"
                  >
                    <span className="truncate pr-3 text-[#F5F2EB]">{q.question}</span>
                    <Link href="/dashboard/knowledge">
                      <Button variant="ghost" size="sm">
                        Add FAQ
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
