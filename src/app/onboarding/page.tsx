import { redirect } from "next/navigation";
import { getAuthenticatedContext } from "@/lib/security/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bootstrapWorkspaceForUser } from "@/lib/workspaces/bootstrap";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import type { BusinessProfile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const ctx = await getAuthenticatedContext();
  if (!ctx) redirect("/sign-in");

  const workspace =
    ctx.workspace ??
    (await bootstrapWorkspaceForUser({
      userId: ctx.userId,
      businessName: ctx.profile?.full_name ? `${ctx.profile.full_name}'s Business` : "My Business",
    }));

  const supabase = await createSupabaseServerClient();
  const [{ data: businessProfile }, { data: assistant }, { data: settings }] = await Promise.all([
    supabase
      .from("business_profiles")
      .select("*")
      .eq("workspace_id", workspace.id)
      .maybeSingle<BusinessProfile>(),
    supabase.from("assistants").select("name").eq("workspace_id", workspace.id).maybeSingle(),
    supabase
      .from("assistant_settings")
      .select("welcome_message")
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ]);

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-[#11100E]">
      <OnboardingWizard
        workspace={workspace}
        businessProfile={businessProfile ?? null}
        initialAssistantName={assistant?.name ?? "Harmek"}
        initialWelcome={settings?.welcome_message ?? "Hello! How can I help you today?"}
        appOrigin={appOrigin}
      />
    </div>
  );
}
