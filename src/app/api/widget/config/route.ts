import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const widgetKey = searchParams.get("key")?.trim();

  if (!widgetKey || widgetKey.length < 12) {
    return NextResponse.json({ error: "Invalid widget key." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`widget_cfg:${ip}:${widgetKey}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const admin = createSupabaseAdminClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, name, widget_key")
    .eq("widget_key", widgetKey)
    .maybeSingle();

  if (!workspace) {
    return NextResponse.json({ error: "Widget not found." }, { status: 404 });
  }

  const [{ data: assistant }, { data: settings }, { data: bp }, { data: sampleProduct }] =
    await Promise.all([
      admin
        .from("assistants")
        .select("name, avatar_url, is_active")
        .eq("workspace_id", workspace.id)
        .single(),
      admin
        .from("assistant_settings")
        .select("welcome_message, widget_primary_color, widget_position, widget_require_consent")
        .eq("workspace_id", workspace.id)
        .single(),
      admin
        .from("business_profiles")
        .select("business_name, delivery_info, operating_hours")
        .eq("workspace_id", workspace.id)
        .maybeSingle(),
      admin
        .from("products")
        .select("name")
        .eq("workspace_id", workspace.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

  const starterPrompts: string[] = [];
  if (sampleProduct?.name) starterPrompts.push(`How much is ${sampleProduct.name}?`);
  starterPrompts.push("What do you sell?");
  if (bp?.delivery_info?.trim()) starterPrompts.push("Delivery info");
  if (bp?.operating_hours && Object.keys(bp.operating_hours as Record<string, string>).length > 0) {
    starterPrompts.push("Opening hours");
  }
  starterPrompts.push("Speak to a human");

  // Only return safe public branding fields — never expose API keys or internal config
  return NextResponse.json({
    businessName: bp?.business_name ?? workspace.name,
    assistantName: assistant?.name ?? "Harmek",
    isActive: assistant?.is_active ?? false,
    welcomeMessage: settings?.welcome_message ?? "Hello! How can I help you today?",
    primaryColor: settings?.widget_primary_color ?? "#D97745",
    position: settings?.widget_position ?? "bottom-right",
    requireConsent: settings?.widget_require_consent ?? true,
    starterPrompts: starterPrompts.slice(0, 4),
  });
}
