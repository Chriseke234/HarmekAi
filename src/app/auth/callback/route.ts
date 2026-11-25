import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bootstrapWorkspaceForUser } from "@/lib/workspaces/bootstrap";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure the user has an isolated workspace bootstrapped after email verification
      const { data: existing } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", data.user.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        const initialName =
          (data.user.user_metadata?.initial_business_name as string | undefined) ||
          "My Business";
        await bootstrapWorkspaceForUser({
          userId: data.user.id,
          businessName: initialName,
        }).catch(() => null);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in`);
}
