"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

interface AnalyticsPayload {
  summary: {
    totalConversations: number;
    aiHandledConversations: number;
    humanHandledConversations: number;
    escalatedConversations: number;
    resolvedConversations: number;
    leadsCaptured: number;
    salesCompleted: number;
    verifiedRevenueTotal?: number;
    unansweredCount: number;
    avgFirstResponseMs: number | null;
    nativeMessagesUsed: number;
    enhancedMessagesUsed: number;
  };
  dailySeries: Array<{ date: string; ai: number; human: number }>;
  unansweredQuestions: Array<{
    id: string;
    question: string;
    detected_intent: string | null;
    confidence: number | null;
    status: string;
  }>;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#B5AEA2]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="mt-1 text-sm text-[#B5AEA2]">
            Real database metrics separating handled conversations, resolutions, leads, and
            recorded sales.
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "secondary"}
              onClick={() => setDays(d)}
            >
              Last {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Distinct Outcome Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Conversations Handled (AI)", value: String(s?.aiHandledConversations ?? 0) },
          { label: "Conversations Resolved", value: String(s?.resolvedConversations ?? 0) },
          { label: "Leads Captured", value: String(s?.leadsCaptured ?? 0) },
          { label: "Sales Completed (Verified)", value: String(s?.salesCompleted ?? 0) },
          {
            label: "Staff-Verified Revenue",
            value: `$${(s?.verifiedRevenueTotal ?? 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-[#B5AEA2]">{m.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-white">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-[#B5AEA2]">Average First Response</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {s?.avgFirstResponseMs ? `${(s.avgFirstResponseMs / 1000).toFixed(2)}s` : "No data yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-[#B5AEA2]">Native Engine Messages</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {s?.nativeMessagesUsed ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-[#B5AEA2]">Enhanced AI Messages</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {s?.enhancedMessagesUsed ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>AI vs. Human Conversation Volume</CardTitle>
          <CardDescription>Daily breakdown over the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.dailySeries || data.dailySeries.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" />}
              title="No conversation volume recorded in this window"
              description="Charts populate automatically from real customer interactions."
            />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2B2722" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#181613",
                      borderColor: "#2B2722",
                      color: "#F8FAFC",
                    }}
                  />
                  <Bar dataKey="ai" name="AI-Handled" fill="#D97745" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="human" name="Human-Handled" fill="#84A98C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Gap Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Knowledge Gap Report</CardTitle>
              <CardDescription>
                Real customer questions that Harmek could not answer with verified information.
              </CardDescription>
            </div>
            <Link href="/dashboard/knowledge">
              <Button size="sm" variant="secondary">
                Update Knowledge Base
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!data?.unansweredQuestions || data.unansweredQuestions.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="h-5 w-5" />}
              title="No unanswered questions recorded"
              description="When customers ask questions outside your verified business knowledge, they will be listed here."
            />
          ) : (
            <div className="space-y-2.5">
              {data.unansweredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-lg border border-[#2B2722] bg-[#141210] px-4 py-3 text-sm"
                >
                  <span className="text-[#F5F2EB]">{q.question}</span>
                  <Badge variant="warning">
                    {q.detected_intent?.replace(/_/g, " ") || "unmatched"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
