"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [topic, setTopic] = useState("General Support");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ ticketId: string; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        businessName,
        topic,
        message,
      }),
    });
    setSubmitting(false);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Unable to submit your support request.");
      return;
    }

    setSuccess({ ticketId: data.ticketId, message: data.message });
    setFullName("");
    setEmail("");
    setBusinessName("");
    setMessage("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="font-display text-4xl font-normal text-[#FAFAFA] sm:text-5xl">
            Contact &amp; Support
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#A3A3A3]">
            Need help setting up your Knowledge Base, embedding the website chat widget, or
            connecting WhatsApp Business Platform? Reach our team directly.
          </p>

          <div className="mt-8 space-y-4 border-t border-[#262626] pt-6 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-[#FFFFFF]" />
              <div>
                <p className="font-semibold text-[#FAFAFA]">Direct Email</p>
                <a
                  href="mailto:ai.harmek.build@gmail.com"
                  className="text-[#A3A3A3] hover:text-[#FFFFFF]"
                >
                  ai.harmek.build@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-5 w-5 text-[#D4D4D4]" />
              <div>
                <p className="font-semibold text-[#FAFAFA]">Operator</p>
                <p className="text-[#A3A3A3]">Harmek AI (operated by ChrisBuilds)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Send a Support Request</CardTitle>
              <CardDescription>
                Every submission is logged directly into our support queue for follow-up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-3 rounded-lg border border-[#D4D4D4]/40 bg-[#D4D4D4]/10 p-5 text-sm text-[#FAFAFA]">
                  <div className="flex items-center gap-2 font-semibold text-[#E5E5E5]">
                    <CheckCircle2 className="h-5 w-5" />
                    Support Request Received
                  </div>
                  <p className="text-[#D4D4D4]">{success.message}</p>
                  <p className="font-mono text-xs text-[#8F8F8F]">
                    Reference ID: {success.ticketId}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSuccess(null)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error ? (
                    <div className="flex items-start gap-2 rounded-lg border border-[#D95B5B]/40 bg-[#D95B5B]/10 p-3 text-xs text-[#EB9494]">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="fullName" className="text-xs font-medium text-[#D4D4D4]">
                        Your Name
                      </label>
                      <Input
                        id="fullName"
                        required
                        placeholder="Ada Okafor"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-medium text-[#D4D4D4]">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="you@yourbusiness.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="businessName"
                        className="text-xs font-medium text-[#D4D4D4]"
                      >
                        Business Name (optional)
                      </label>
                      <Input
                        id="businessName"
                        placeholder="Lumina Skincare"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="topic" className="text-xs font-medium text-[#D4D4D4]">
                        Topic
                      </label>
                      <Select
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      >
                        <option value="General Support">General Support</option>
                        <option value="Onboarding & Setup Help">Onboarding &amp; Setup Help</option>
                        <option value="Billing & 14-Day Trial">Billing &amp; 14-Day Trial</option>
                        <option value="WhatsApp & Integrations">WhatsApp &amp; Integrations</option>
                        <option value="Security & Privacy">Security &amp; Privacy</option>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-medium text-[#D4D4D4]">
                      How can we help?
                    </label>
                    <Textarea
                      id="message"
                      required
                      minLength={10}
                      placeholder="Describe your question, workspace setup, or issue..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Support Request
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
