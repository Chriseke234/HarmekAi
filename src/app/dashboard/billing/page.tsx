"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, FileBarChart, Loader2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrialPerformanceReport, TrialSummary } from "@/lib/billing/trial";

interface BillingAnalyticsResponse {
  trialStatus: TrialSummary;
  trialReport: TrialPerformanceReport;
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BillingAnalyticsResponse | null>(null);
  const [selectedPlanNotice, setSelectedPlanNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics?days=30")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-48 items-center justify-center text-[#A3A3A3]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const { trialStatus, trialReport } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Billing &amp; 14-Day Trial</h1>
        <p className="mt-1 text-sm text-[#A3A3A3]">
          Track your activation-based 14-day free trial, usage limits, and real Trial
          Performance Report.
        </p>
      </div>

      {/* Trial Status Card */}
      <Card className="border-[#FFFFFF]/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#FFFFFF]" />
              Trial Status
            </CardTitle>
            <Badge
              variant={
                trialStatus.status === "active"
                  ? "success"
                  : trialStatus.status === "expired"
                    ? "warning"
                    : "secondary"
              }
            >
              {trialStatus.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <CardDescription>
            {trialStatus.status === "not_started"
              ? "Your 14-day free trial has not started yet. It begins automatically when you activate your assistant."
              : trialStatus.status === "active"
                ? `${trialStatus.daysRemaining} day${
                    trialStatus.daysRemaining === 1 ? "" : "s"
                  } remaining in your 14-day trial. No credit card required during trial.`
                : "Your 14-day trial period has completed. Your business data remains safely preserved."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#262626] bg-[#0E0E0E] p-4">
            <p className="text-xs text-[#A3A3A3]">Conversations Remaining</p>
            <p className="mt-1 text-xl font-bold text-white">
              {trialReport.metrics.remainingConversations} / {trialStatus.conversationLimit}
            </p>
          </div>
          <div className="rounded-lg border border-[#262626] bg-[#0E0E0E] p-4">
            <p className="text-xs text-[#A3A3A3]">Automated Messages Remaining</p>
            <p className="mt-1 text-xl font-bold text-white">
              {trialReport.metrics.remainingMessages} / {trialStatus.messageLimit}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Genuine Trial Performance Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-[#FFFFFF]" />
            Harmek AI Trial Performance Report
          </CardTitle>
          <CardDescription>
            Compiled strictly from real recorded workspace conversations and messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!trialReport.hasSufficientData ? (
            <div className="rounded-lg border border-[#262626] bg-[#0E0E0E] p-4 text-sm text-[#D4D4D4]">
              {trialReport.insufficientDataMessage}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[#262626] bg-[#0E0E0E] p-3.5">
                <p className="text-xs text-[#A3A3A3]">Total Conversations</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {trialReport.metrics.totalConversations}
                </p>
              </div>
              <div className="rounded-lg border border-[#262626] bg-[#0E0E0E] p-3.5">
                <p className="text-xs text-[#A3A3A3]">AI-Handled</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {trialReport.metrics.aiHandledConversations}
                </p>
              </div>
              <div className="rounded-lg border border-[#262626] bg-[#0E0E0E] p-3.5">
                <p className="text-xs text-[#A3A3A3]">Human Escalations</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {trialReport.metrics.humanEscalations}
                </p>
              </div>
              <div className="rounded-lg border border-[#262626] bg-[#0E0E0E] p-3.5">
                <p className="text-xs text-[#A3A3A3]">Leads Captured</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {trialReport.metrics.leadsCaptured}
                </p>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
              Actionable Knowledge Suggestions
            </h4>
            <ul className="mt-2 space-y-2 text-sm text-[#D4D4D4]">
              {trialReport.suggestions.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FFFFFF]" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Options (Modular — No Fake Payment Confirmation) */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            Upgrade anytime during or after your trial. Billing integration is modular and
            requires a connected payment processor before charging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedPlanNotice ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
              {selectedPlanNotice}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Starter", price: "$29/mo", limit: "1,000 conversations/mo" },
              { name: "Growth", price: "$79/mo", limit: "5,000 conversations/mo" },
              { name: "Scale", price: "$199/mo", limit: "25,000 conversations/mo" },
            ].map((plan) => (
              <div
                key={plan.name}
                className="flex flex-col justify-between rounded-xl border border-[#262626] bg-[#0E0E0E] p-5"
              >
                <div>
                  <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-bold text-white">{plan.price}</p>
                  <p className="mt-1 text-xs text-[#A3A3A3]">{plan.limit}</p>
                </div>
                <Button
                  className="mt-4 w-full"
                  variant="secondary"
                  onClick={() =>
                    setSelectedPlanNotice(
                      `Plan "${plan.name}" selected. Connect your billing provider (e.g. Stripe or Paystack) in environment configuration to enable live subscription checkout.`
                    )
                  }
                >
                  Select {plan.name}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-[#262626] bg-[#0E0E0E] p-4 text-xs text-[#A3A3A3]">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#FFFFFF]" />
            <span>
              Post-trial policy: When a trial expires, Sage pauses automated widget responses
              while keeping all contacts, conversations, knowledge items, and performance
              reports intact and readable.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
