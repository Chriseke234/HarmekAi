"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("General");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
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
        delivery_info: deliveryInfo,
        return_policy: returnPolicy,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setNotice("Workspace business profile updated.");
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setNotice(err.error ?? "Could not save settings.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#A3A3A3]">
          Update your business profile, contact details, delivery info, and policies used by
          Harmek AI.
        </p>
      </div>

      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#FFFFFF]/40 bg-[#FFFFFF]/10 px-4 py-3 text-sm text-[#FAFAFA]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            Changes here update the verified business context used by your assistant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D4D4D4]">Business Name</label>
                <Input
                  required
                  placeholder="Your Business Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#D4D4D4]">Industry</label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#D4D4D4]">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                placeholder="Website URL"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Business Email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
              />
              <Input
                placeholder="Business Phone"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
              />
            </div>

            <Input
              placeholder="Location / Store Address"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Textarea
                placeholder="Delivery information..."
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
              />
              <Textarea
                placeholder="Return / booking policy..."
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
