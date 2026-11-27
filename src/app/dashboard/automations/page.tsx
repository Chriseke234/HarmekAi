"use client";

import { useEffect, useState } from "react";
import { Loader2, Workflow } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import type { AutomationRule } from "@/types/database";

interface ExecutionLog {
  id: string;
  status: string;
  summary: string;
  executed_at: string;
  automations?: { name?: string } | null;
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/automations");
    if (res.ok) {
      const data = await res.json();
      setRules(data.automations ?? []);
      setExecutions(data.executions ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function toggleRule(rule: AutomationRule) {
    const next = !rule.is_enabled;
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, is_enabled: next } : r))
    );
    await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, is_enabled: next }),
    });
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-[#A3A3A3]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Automations</h1>
        <p className="mt-1 text-sm text-[#A3A3A3]">
          Simple, guided business rules that run automatically while respecting customer consent.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                  <Badge variant="secondary">{rule.trigger_event.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-xs leading-relaxed text-[#A3A3A3]">{rule.description}</p>
              </div>
              <Switch
                checked={rule.is_enabled}
                onCheckedChange={() => toggleRule(rule)}
                aria-label={`Toggle ${rule.name}`}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution Logs</CardTitle>
          <CardDescription>Real automation runs recorded across your conversations.</CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <EmptyState
              icon={<Workflow className="h-5 w-5" />}
              title="No automation executions logged yet"
              description="As customers interact with your assistant, enabled automations will log every execution here."
            />
          ) : (
            <div className="space-y-2">
              {executions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#0E0E0E] px-4 py-2.5 text-xs"
                >
                  <div>
                    <span className="font-medium text-white">
                      {ex.automations?.name || "Automation"}
                    </span>
                    <span className="ml-2 text-[#A3A3A3]">{ex.summary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ex.status === "executed" ? "success" : "warning"}>
                      {ex.status}
                    </Badge>
                    <span className="text-[#8F8F8F]">{formatRelativeTime(ex.executed_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
