"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Copy, Globe, Loader2, Plug, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { IntegrationRecord } from "@/types/database";

const CHANNEL_META = [
  {
    provider: "whatsapp" as const,
    name: "WhatsApp Business Platform",
    description:
      "Connect your official Meta WhatsApp Cloud API phone number ID and webhook verify token.",
    fieldLabel: "WhatsApp Business Account / Phone Number ID",
  },
  {
    provider: "instagram" as const,
    name: "Instagram Messaging API",
    description:
      "Connect an official Instagram Professional account through Meta Graph API.",
    fieldLabel: "Instagram Business Account ID",
  },
  {
    provider: "messenger" as const,
    name: "Facebook Messenger",
    description: "Connect your official Facebook Page to receive Messenger enquiries.",
    fieldLabel: "Facebook Page ID",
  },
  {
    provider: "webhook" as const,
    name: "Outbound Webhooks & API",
    description:
      "Send signed JSON event payloads to your own server on new leads or human handoffs.",
    fieldLabel: "HTTPS Webhook Endpoint URL",
  },
];

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [widgetKey, setWidgetKey] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#FFFFFF");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [requireConsent, setRequireConsent] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! How can I help you today?");
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [channelInputs, setChannelInputs] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/integrations");
    if (res.ok) {
      const data = await res.json();
      setWidgetKey(data.widgetKey || "");
      setIntegrations(data.integrations ?? []);
      if (data.widgetSettings) {
        setPrimaryColor(data.widgetSettings.widget_primary_color || "#FFFFFF");
        setPosition(data.widgetSettings.widget_position || "bottom-right");
        setRequireConsent(Boolean(data.widgetSettings.widget_require_consent));
        setWelcomeMessage(data.widgetSettings.welcome_message || "");
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://your-sage-domain.com";
  const snippet = `<script src="${origin}/api/widget/loader.js" data-widget-key="${widgetKey}" async></script>`;

  async function saveWidgetSettings() {
    setSaving(true);
    setNotice(null);
    const res = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "website_widget",
        widget_primary_color: primaryColor,
        widget_position: position,
        widget_require_consent: requireConsent,
        welcome_message: welcomeMessage,
      }),
    });
    setSaving(false);
    if (res.ok) setNotice("Website chat widget settings saved.");
  }

  async function saveChannelConfig(provider: "whatsapp" | "instagram" | "messenger" | "webhook") {
    const val = channelInputs[provider]?.trim();
    if (!val) return;
    setSaving(true);
    setNotice(null);
    const res = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        public_config: { identifier: val },
      }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    setNotice(data.notice ?? data.error ?? "Configuration updated.");
    loadData();
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
        <h1 className="text-2xl font-bold tracking-tight text-white">Integrations</h1>
        <p className="mt-1 text-sm text-[#A3A3A3]">
          Install your Website Chat Widget now and prepare official messaging channels.
        </p>
      </div>

      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#FFFFFF]/40 bg-[#FFFFFF]/10 px-4 py-3 text-sm text-[#FAFAFA]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      {/* Website Chat Widget */}
      <Card className="border-[#FFFFFF]/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#FFFFFF]" />
              Website Chat Widget
            </CardTitle>
            <Badge variant="success">Ready to Embed</Badge>
          </div>
          <CardDescription>
            Paste this single line before your website&apos;s closing &lt;/body&gt; tag. No
            private API keys are exposed in browser code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#0E0E0E] p-3 font-mono text-xs text-[#E5E5E5]">
            <code className="flex-1 overflow-x-auto">{snippet}</code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#D4D4D4]">Brand Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-[#383838] bg-transparent"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#D4D4D4]">Widget Position</label>
              <Select
                value={position}
                onChange={(e) =>
                  setPosition(e.target.value as "bottom-right" | "bottom-left")
                }
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#0E0E0E] px-3 py-2">
              <span className="text-xs text-[#D4D4D4]">Require persistence consent</span>
              <Switch checked={requireConsent} onCheckedChange={setRequireConsent} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href={`/widget/${widgetKey}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-[#FFFFFF] hover:underline"
            >
              Open Live Widget Preview in New Tab
            </a>
            <Button onClick={saveWidgetSettings} disabled={saving}>
              <Save className="h-4 w-4" />
              Save Widget Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modular Official Channels */}
      <div className="grid gap-4 md:grid-cols-2">
        {CHANNEL_META.map((ch) => {
          const existing = integrations.find((i) => i.provider === ch.provider);
          const status = existing?.status ?? "disconnected";
          return (
            <Card key={ch.provider}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plug className="h-4 w-4 text-[#A3A3A3]" />
                    {ch.name}
                  </CardTitle>
                  <Badge
                    variant={
                      status === "connected"
                        ? "success"
                        : status === "pending_verification"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <CardDescription>{ch.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ch.provider === "whatsapp" ? (
                  <div className="rounded-lg border border-[#262626] bg-[#0E0E0E] p-3 text-xs text-[#A3A3A3]">
                    <p className="font-medium text-[#FAFAFA]">Official Meta Webhook Callback URL:</p>
                    <code className="mt-1 block break-all font-mono text-[11px] text-[#FFFFFF]">
                      {origin}/api/webhooks/whatsapp
                    </code>
                    <p className="mt-1.5 text-[11px] text-[#8F8F8F]">
                      Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_WEBHOOK_VERIFY_TOKEN, and META_APP_SECRET
                      in your server environment, then enter your Phone Number ID below.
                    </p>
                  </div>
                ) : null}
                <Input
                  placeholder={ch.fieldLabel}
                  value={channelInputs[ch.provider] ?? ""}
                  onChange={(e) =>
                    setChannelInputs({ ...channelInputs, [ch.provider]: e.target.value })
                  }
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => saveChannelConfig(ch.provider)}
                >
                  Save &amp; Mark Pending Verification
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
