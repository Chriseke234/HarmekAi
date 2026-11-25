"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Cpu,
  KeyRound,
  Loader2,
  Save,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmberFox } from "@/components/brand/ember-fox";
import type {
  Assistant,
  AssistantSettings,
  AssistantTone,
  EnhancedProviderName,
  IntelligenceMode,
} from "@/types/database";

interface SimMessage {
  role: "user" | "assistant";
  content: string;
  mode?: string;
  intent?: string;
  confidence?: number;
  sources?: Array<{ title: string; type: string }>;
}

export default function AssistantPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [settings, setSettings] = useState<AssistantSettings | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [configuredProviders, setConfiguredProviders] = useState<
    Array<{ provider: string; key_last_four: string; is_verified: boolean }>
  >([]);

  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simMessages, setSimMessages] = useState<SimMessage[]>([]);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/assistant");
    if (res.ok) {
      const data = await res.json();
      setAssistant(data.assistant);
      setSettings(data.settings);
      setConfiguredProviders(data.configuredProviders ?? []);
      setSimMessages([
        {
          role: "assistant",
          content: data.settings?.welcome_message || "Hello! How can I help you today?",
        },
      ]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSave() {
    if (!assistant || !settings) return;
    setSaving(true);
    setNotice(null);

    const res = await fetch("/api/assistant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: assistant.name,
        is_active: assistant.is_active,
        tone: settings.tone,
        formality: settings.formality,
        response_length: settings.response_length,
        welcome_message: settings.welcome_message,
        avoided_topics: settings.avoided_topics,
        escalation_keywords: settings.escalation_keywords,
        clarification_enabled: settings.clarification_enabled,
        auto_answer_threshold: Number(settings.auto_answer_threshold),
        clarification_threshold: Number(settings.clarification_threshold),
        intelligence_mode: settings.intelligence_mode,
        enhanced_provider: settings.enhanced_provider,
        enhanced_model: settings.enhanced_model,
        api_key_plaintext: apiKeyInput.trim() || undefined,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setApiKeyInput("");
      setNotice("Assistant settings saved.");
      loadData();
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setNotice(err.error ?? "Failed to save assistant settings.");
    }
  }

  async function handleTestProvider() {
    if (!settings?.enhanced_provider || !apiKeyInput.trim()) {
      setNotice("Select a provider and enter an API key to test the connection.");
      return;
    }
    setTestingConn(true);
    setNotice(null);
    const res = await fetch("/api/assistant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enhanced_provider: settings.enhanced_provider,
        enhanced_model: settings.enhanced_model,
        api_key_plaintext: apiKeyInput.trim(),
        test_provider_connection: true,
      }),
    });
    setTestingConn(false);
    const data = await res.json().catch(() => ({}));
    if (data.testResult) {
      setNotice(data.testResult.message);
      if (data.testResult.ok) {
        setApiKeyInput("");
        loadData();
      }
    } else {
      setNotice(data.error ?? "Connection test failed.");
    }
  }

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    if (!simInput.trim() || simLoading) return;
    const text = simInput.trim();
    setSimInput("");
    setSimMessages((prev) => [...prev, { role: "user", content: text }]);
    setSimLoading(true);

    const res = await fetch("/api/assistant/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    setSimLoading(false);
    if (res.ok) {
      const { result } = await res.json();
      setSimMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.reply,
          mode: result.intelligenceModeUsed,
          intent: result.intent,
          confidence: result.confidence,
          sources: result.sources,
        },
      ]);
    }
  }

  if (loading || !assistant || !settings) {
    return (
      <div className="flex h-64 items-center justify-center text-[#B5AEA2]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Assistant</h1>
          <p className="mt-1 text-sm text-[#B5AEA2]">
            Configure personality, confidence rules, and optional Enhanced AI without writing
            technical prompts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#2B2722] bg-[#181613] px-3 py-2">
            <span className="text-xs font-medium text-[#D6D0C4]">
              {assistant.is_active ? "Active" : "Paused"}
            </span>
            <Switch
              checked={assistant.is_active}
              onCheckedChange={(checked) =>
                setAssistant({ ...assistant, is_active: checked })
              }
              aria-label="Toggle assistant active status"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#D97745]/40 bg-[#D97745]/10 px-4 py-3 text-sm text-[#F5F2EB]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#D97745]" />
                  Intelligence Mode
                </CardTitle>
                <Badge variant={settings.intelligence_mode === "enhanced" ? "default" : "success"}>
                  {settings.intelligence_mode === "enhanced"
                    ? "Enhanced AI (with Native fallback)"
                    : "Native Harmek Engine"}
                </Badge>
              </div>
              <CardDescription>
                Harmek works 100% natively without an external LLM API. Enhanced AI is strictly
                optional and falls back automatically if disabled or unavailable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, intelligence_mode: "native" as IntelligenceMode })
                  }
                  className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                    settings.intelligence_mode === "native"
                      ? "border-[#D97745] bg-[#D97745]/10"
                      : "border-[#2B2722] bg-[#141210] hover:border-[#3D3730]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Bot className="h-4 w-4 text-[#D97745]" />
                    Native Harmek Engine
                  </div>
                  <p className="mt-1 text-xs text-[#B5AEA2]">
                    Default mode. Zero external API key needed. Deterministic &amp; grounded.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      intelligence_mode: "enhanced" as IntelligenceMode,
                      enhanced_provider: settings.enhanced_provider ?? "openai",
                    })
                  }
                  className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                    settings.intelligence_mode === "enhanced"
                      ? "border-[#D97745] bg-[#D97745]/10"
                      : "border-[#2B2722] bg-[#141210] hover:border-[#3D3730]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Sparkles className="h-4 w-4 text-[#D97745]" />
                    Enhanced AI (Optional)
                  </div>
                  <p className="mt-1 text-xs text-[#B5AEA2]">
                    Connect OpenAI, Anthropic, or Gemini with encrypted server-side keys.
                  </p>
                </button>
              </div>

              {settings.intelligence_mode === "enhanced" ? (
                <div className="space-y-3 rounded-xl border border-[#2B2722] bg-[#141210] p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#D6D0C4]">Provider</label>
                      <Select
                        value={settings.enhanced_provider ?? "openai"}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            enhanced_provider: e.target.value as EnhancedProviderName,
                          })
                        }
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="gemini">Google Gemini</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#D6D0C4]">
                        Model (optional)
                      </label>
                      <Input
                        placeholder="Default model if blank"
                        value={settings.enhanced_model ?? ""}
                        onChange={(e) =>
                          setSettings({ ...settings, enhanced_model: e.target.value || null })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[#D6D0C4]">
                      <KeyRound className="h-3.5 w-3.5" />
                      API Key (encrypted server-side, never exposed in browser)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Paste provider API key to store or update"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleTestProvider}
                        disabled={testingConn}
                      >
                        {testingConn ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                    </div>
                  </div>
                  {configuredProviders.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {configuredProviders.map((cp) => (
                        <Badge key={cp.provider} variant={cp.is_verified ? "success" : "secondary"}>
                          {cp.provider} (••••{cp.key_last_four})
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personality &amp; Response Rules</CardTitle>
              <CardDescription>
                Control tone, confidence thresholds, and human handoff triggers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#D6D0C4]">Assistant Name</label>
                  <Input
                    value={assistant.name}
                    onChange={(e) => setAssistant({ ...assistant, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#D6D0C4]">Tone Preset</label>
                  <Select
                    value={settings.tone}
                    onChange={(e) =>
                      setSettings({ ...settings, tone: e.target.value as AssistantTone })
                    }
                  >
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="conversational">Conversational</option>
                    <option value="luxury">Luxury</option>
                    <option value="supportive">Supportive</option>
                    <option value="custom">Custom</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Welcome Message</label>
                <Textarea
                  value={settings.welcome_message}
                  onChange={(e) =>
                    setSettings({ ...settings, welcome_message: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#D6D0C4]">
                    Auto-Answer Threshold ({Math.round(settings.auto_answer_threshold * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.4"
                    max="0.9"
                    step="0.05"
                    value={settings.auto_answer_threshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        auto_answer_threshold: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#D97745]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#D6D0C4]">
                    Clarification Threshold ({Math.round(settings.clarification_threshold * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="0.65"
                    step="0.05"
                    value={settings.clarification_threshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        clarification_threshold: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#D97745]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">
                  Avoided Topics (comma-separated)
                </label>
                <Input
                  value={(settings.avoided_topics ?? []).join(", ")}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      avoided_topics: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">
                  Escalation Keywords (comma-separated)
                </label>
                <Input
                  value={(settings.escalation_keywords ?? []).join(", ")}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      escalation_keywords: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-24">
            <CardHeader>
              <div className="flex items-center gap-3">
                <EmberFox mood={simLoading ? "thinking" : "friendly"} size={42} />
                <div>
                  <CardTitle>Live Conversation Simulator</CardTitle>
                  <CardDescription>
                    Test your current Knowledge Base and tone settings immediately.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-96 space-y-3 overflow-y-auto rounded-xl border border-[#2B2722] bg-[#141210] p-4">
                {simMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm ${
                        m.role === "user"
                          ? "bg-[#D97745] text-white"
                          : "border border-[#2B2722] bg-[#211E1A] text-[#F5F2EB]"
                      }`}
                    >
                      {m.content}
                    </div>
                    {m.role === "assistant" && m.intent ? (
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-[#B5AEA2]">
                        <span className="rounded bg-[#211E1A] px-1.5 py-0.5">
                          mode: {m.mode}
                        </span>
                        <span className="rounded bg-[#211E1A] px-1.5 py-0.5">
                          intent: {m.intent}
                        </span>
                        {typeof m.confidence === "number" ? (
                          <span className="rounded bg-[#211E1A] px-1.5 py-0.5">
                            confidence: {Math.round(m.confidence * 100)}%
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSimulate} className="flex gap-2">
                <Input
                  placeholder="Type a customer question..."
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                />
                <Button type="submit" disabled={simLoading}>
                  {simLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
