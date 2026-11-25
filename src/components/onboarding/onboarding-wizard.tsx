"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmberFox } from "@/components/brand/ember-fox";
import type { AssistantTone, BusinessProfile, Workspace } from "@/types/database";

const STEP_LABELS = [
  "Account",
  "Business Profile",
  "Business Knowledge",
  "Assistant Personality",
  "Conversation Behaviour",
  "Test Harmek",
  "Activate",
];

const INDUSTRIES = [
  "Skincare & Beauty",
  "E-Commerce & Retail",
  "Laundry & Cleaning Services",
  "Salons & Wellness",
  "Hospitality & Food",
  "Professional Services",
  "General",
];

interface OnboardingWizardProps {
  workspace: Workspace;
  businessProfile: BusinessProfile | null;
  initialAssistantName: string;
  initialWelcome: string;
  appOrigin: string;
}

interface SimMessage {
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  sources?: Array<{ title: string; type: string }>;
}

export function OnboardingWizard({
  workspace,
  businessProfile,
  initialAssistantName,
  initialWelcome,
  appOrigin,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(Math.max(2, workspace.onboarding_step || 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Business Profile
  const [businessName, setBusinessName] = useState(
    businessProfile?.business_name || workspace.name
  );
  const [industry, setIndustry] = useState(businessProfile?.industry || "Skincare & Beauty");
  const [description, setDescription] = useState(businessProfile?.description || "");
  const [website, setWebsite] = useState(businessProfile?.website || "");
  const [businessEmail, setBusinessEmail] = useState(businessProfile?.business_email || "");
  const [businessPhone, setBusinessPhone] = useState(businessProfile?.business_phone || "");
  const [locationAddress, setLocationAddress] = useState(
    businessProfile?.location_address || ""
  );
  const [hoursWeekday, setHoursWeekday] = useState(
    businessProfile?.operating_hours?.["Mon-Fri"] || "9:00 AM - 6:00 PM"
  );
  const [hoursWeekend, setHoursWeekend] = useState(
    businessProfile?.operating_hours?.["Sat-Sun"] || "10:00 AM - 4:00 PM"
  );
  const [deliveryInfo, setDeliveryInfo] = useState(businessProfile?.delivery_info || "");
  const [bookingInfo, setBookingInfo] = useState(businessProfile?.booking_info || "");
  const [returnPolicy, setReturnPolicy] = useState(businessProfile?.return_policy || "");

  // Step 3: Quick Knowledge Items
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");
  const [addedItems, setAddedItems] = useState<Array<{ kind: string; label: string }>>([]);

  // Step 4 & 5: Personality & Behaviour
  const [assistantName, setAssistantName] = useState(initialAssistantName || "Harmek");
  const [tone, setTone] = useState<AssistantTone>("friendly");
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcome);
  const [avoidedTopics, setAvoidedTopics] = useState("");
  const [escalationKeywords, setEscalationKeywords] = useState(
    "human, agent, manager, complaint, refund dispute"
  );

  // Step 6: Live Simulator
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simMessages, setSimMessages] = useState<SimMessage[]>([
    { role: "assistant", content: initialWelcome },
  ]);

  // Step 7: Activation & Widget Snippet
  const [activated, setActivated] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippet = `<script src="${appOrigin}/api/widget/loader.js" data-widget-key="${workspace.widget_key}" async></script>`;

  async function saveProfileAndNext() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_profile",
        business_name: businessName,
        industry,
        description,
        website,
        business_email: businessEmail,
        business_phone: businessPhone,
        location_address: locationAddress,
        operating_hours: {
          "Mon-Fri": hoursWeekday,
          "Sat-Sun": hoursWeekend,
        },
        delivery_info: deliveryInfo,
        booking_info: bookingInfo,
        return_policy: returnPolicy,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save business profile.");
      return;
    }
    setStep(3);
  }

  async function addQuickProduct() {
    if (!prodName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "product",
        name: prodName.trim(),
        price: prodPrice ? Number(prodPrice) : null,
        description: prodDesc.trim(),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setAddedItems((prev) => [
        ...prev,
        { kind: "Product", label: `${prodName.trim()}${prodPrice ? ` ($${prodPrice})` : ""}` },
      ]);
      setProdName("");
      setProdPrice("");
      setProdDesc("");
    }
  }

  async function addQuickFaq() {
    if (!faqQ.trim() || !faqA.trim()) return;
    setSaving(true);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "faq",
        question: faqQ.trim(),
        answer: faqA.trim(),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setAddedItems((prev) => [...prev, { kind: "FAQ", label: faqQ.trim() }]);
      setFaqQ("");
      setFaqA("");
    }
  }

  async function saveAssistantAndGo(nextStep: number) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_assistant",
        assistant_name: assistantName,
        tone,
        welcome_message: welcomeMessage,
        avoided_topics: avoidedTopics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        escalation_keywords: escalationKeywords
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        onboarding_step: nextStep,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save assistant settings.");
      return;
    }
    if (nextStep === 6) {
      setSimMessages([{ role: "assistant", content: welcomeMessage }]);
    }
    setStep(nextStep);
  }

  async function sendSimulation(e: React.FormEvent) {
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
      const data = (await res.json()) as {
        result: {
          reply: string;
          confidence: number;
          sources: Array<{ title: string; type: string }>;
        };
      };
      setSimMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.result.reply,
          confidence: data.result.confidence,
          sources: data.result.sources,
        },
      ]);
    }
  }

  async function activateAssistant() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate" }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Activation failed.");
      return;
    }
    setActivated(true);
  }

  function copySnippet() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header & Stepper */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EmberFox
            mood={activated ? "celebrating" : simLoading ? "thinking" : "listening"}
            size={44}
          />
          <div>
            <h1 className="font-display text-xl font-medium text-[#F5F2EB]">
              Harmek AI Guided Setup
            </h1>
            <p className="text-xs text-[#B5AEA2]">
              Step {step} of 7 — {STEP_LABELS[step - 1]}
            </p>
          </div>
        </div>
        <Badge variant="secondary">Native Engine Ready (No LLM API Needed)</Badge>
      </div>

      <div className="mb-8 grid grid-cols-7 gap-2">
        {STEP_LABELS.map((label, idx) => {
          const num = idx + 1;
          const isDone = num < step || activated;
          const isCurrent = num === step && !activated;
          return (
            <div key={label} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  isDone ? "bg-[#D97745]" : isCurrent ? "bg-[#D97745]/70" : "bg-[#211E1A]"
                }`}
              />
              <p className="hidden truncate text-[11px] text-[#B5AEA2] sm:block">{label}</p>
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {/* STEP 2: BUSINESS PROFILE */}
      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tell Harmek about your business</CardTitle>
            <CardDescription>
              Harmek uses these details to answer questions about your hours, location, delivery,
              and policies accurately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Business Name</label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Industry</label>
                <Select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#D6D0C4]">Business Description</label>
              <Textarea
                placeholder="Briefly describe what your business sells or offers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Website</label>
                <Input
                  placeholder="https://yourbusiness.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Business Email</label>
                <Input
                  type="email"
                  placeholder="hello@yourbusiness.com"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Business Phone</label>
                <Input
                  placeholder="+1 555 123 4567"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Location / Address</label>
                <Input
                  placeholder="123 Main Street, Suite 4"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Weekday Hours</label>
                <Input value={hoursWeekday} onChange={(e) => setHoursWeekday(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Weekend Hours</label>
                <Input value={hoursWeekend} onChange={(e) => setHoursWeekend(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Delivery Information</label>
                <Textarea
                  placeholder="Example: Same-day delivery within the city for orders before 2 PM."
                  value={deliveryInfo}
                  onChange={(e) => setDeliveryInfo(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">
                  Booking / Return Policy
                </label>
                <Textarea
                  placeholder="Example: Appointments require 24-hour notice. Unopened items returnable within 14 days."
                  value={bookingInfo || returnPolicy}
                  onChange={(e) => {
                    setBookingInfo(e.target.value);
                    setReturnPolicy(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={saveProfileAndNext} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save & Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 3: BUSINESS KNOWLEDGE */}
      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle>Add starter products and FAQs</CardTitle>
            <CardDescription>
              Add a few items now so you can test Harmek immediately. You can add unlimited
              products, services, policies, and documents later in your Knowledge Base.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-[#2B2722] bg-[#141210] p-4 space-y-3">
              <h4 className="text-sm font-medium text-white">Quick Add Product / Service</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Product or service name"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Price (e.g. 28)"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                />
                <Input
                  placeholder="Short description"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                />
              </div>
              <Button variant="secondary" size="sm" onClick={addQuickProduct} disabled={saving}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            <div className="rounded-xl border border-[#2B2722] bg-[#141210] p-4 space-y-3">
              <h4 className="text-sm font-medium text-white">Quick Add FAQ</h4>
              <Input
                placeholder="Customer question (e.g. Do you offer gift wrapping?)"
                value={faqQ}
                onChange={(e) => setFaqQ(e.target.value)}
              />
              <Textarea
                placeholder="Verified answer..."
                value={faqA}
                onChange={(e) => setFaqA(e.target.value)}
              />
              <Button variant="secondary" size="sm" onClick={addQuickFaq} disabled={saving}>
                <Plus className="h-4 w-4" />
                Add FAQ
              </Button>
            </div>

            {addedItems.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#B5AEA2]">Added to Knowledge Base:</p>
                <div className="flex flex-wrap gap-2">
                  {addedItems.map((it, i) => (
                    <Badge key={i} variant="success">
                      {it.kind}: {it.label}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Continue to Personality
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 4: ASSISTANT PERSONALITY */}
      {step === 4 ? (
        <Card>
          <CardHeader>
            <CardTitle>Choose your assistant&apos;s personality</CardTitle>
            <CardDescription>
              No prompt writing needed. Pick how you want Sage to greet and speak to customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Assistant Name</label>
                <Input
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D6D0C4]">Tone of Voice</label>
                <Select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as AssistantTone)}
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
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => saveAssistantAndGo(5)} disabled={saving}>
                Continue to Behaviour
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 5: CONVERSATION BEHAVIOUR */}
      {step === 5 ? (
        <Card>
          <CardHeader>
            <CardTitle>Set boundaries &amp; human handoff rules</CardTitle>
            <CardDescription>
              Tell Sage which topics to avoid and when to bring in a human team member.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#D6D0C4]">
                Topics Harmek must avoid (comma-separated, optional)
              </label>
              <Input
                placeholder="medical diagnosis, legal advice, competitor pricing"
                value={avoidedTopics}
                onChange={(e) => setAvoidedTopics(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#D6D0C4]">
                Keywords that trigger human handoff (comma-separated)
              </label>
              <Input
                value={escalationKeywords}
                onChange={(e) => setEscalationKeywords(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(4)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => saveAssistantAndGo(6)} disabled={saving}>
                Test Harmek Live
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 6: TEST SAGE SIMULATOR */}
      {step === 6 ? (
        <Card>
          <CardHeader>
            <CardTitle>Test {assistantName} with real customer questions</CardTitle>
            <CardDescription>
              Ask about your products, prices, hours, or delivery. Notice how Sage cites its
              knowledge sources and avoids guessing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-72 space-y-3 overflow-y-auto rounded-xl border border-[#2B2722] bg-[#141210] p-4">
              {simMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-[#D97745] text-white"
                        : "border border-[#2B2722] bg-[#211E1A] text-[#F5F2EB]"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {msg.sources.map((src, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-[#211E1A] px-2 py-0.5 text-[11px] text-[#B5AEA2]"
                        >
                          Source: {src.title}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <form onSubmit={sendSimulation} className="flex gap-2">
              <Input
                placeholder="Ask a question (e.g. What are your opening hours?)"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
              />
              <Button type="submit" disabled={simLoading}>
                {simLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(5)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(7)}>
                Proceed to Activation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* STEP 7: ACTIVATE & DEPLOY */}
      {step === 7 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {activated ? "Harmek AI is now active" : "Activate your assistant"}
            </CardTitle>
            <CardDescription>
              {activated
                ? "Your 14-day free trial has started. Copy the script below onto your website to go live."
                : "Activating Sage starts your 14-day free trial (no credit card required) and enables live website chat."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!activated ? (
              <div className="rounded-xl border border-[#D97745]/30 bg-[#D97745]/10 p-5">
                <div className="flex items-start gap-3">
                  <Bot className="mt-0.5 h-5 w-5 text-[#D97745]" />
                  <div className="text-sm text-[#F5F2EB]">
                    <p className="font-medium text-white">Ready to launch with Native Harmek Engine</p>
                    <p className="mt-1 text-[#B5AEA2]">
                      No external LLM API key is needed. You can optionally enable Enhanced AI
                      anytime in your dashboard.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setStep(6)}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Simulator
                  </Button>
                  <Button onClick={activateAssistant} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Activate Assistant &amp; Start 14-Day Trial
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#D6D0C4]">
                    Website Installation Snippet (paste before &lt;/body&gt;)
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-[#2B2722] bg-[#141210] p-3 font-mono text-xs text-[#F0A47A]">
                    <code className="flex-1 overflow-x-auto">{snippet}</code>
                    <Button variant="secondary" size="sm" onClick={copySnippet}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => router.push("/dashboard")}>
                    Open Business Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
