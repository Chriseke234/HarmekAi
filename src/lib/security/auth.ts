import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, Workspace, WorkspaceRole } from "@/types/database";

export interface AuthenticatedContext {
  userId: string;
  email: string;
  profile: Profile | null;
  workspace: Workspace | null;
  role: WorkspaceRole | null;
}

/**
 * Verifies the role of a user against a required list of allowed roles.
 * Pure helper exported for unit testing and server-side guards.
 */
export function hasRequiredRole(
  userRole: WorkspaceRole | null | undefined,
  allowedRoles: WorkspaceRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Loads the current authenticated user, their profile, and their active workspace membership.
 */
export async function getAuthenticatedContext(
  requestedWorkspaceId?: string | null
): Promise<AuthenticatedContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  let memberQuery = supabase
    .from("workspace_members")
    .select("role, workspace_id, workspaces(*)")
    .eq("user_id", user.id);

  if (requestedWorkspaceId) {
    memberQuery = memberQuery.eq("workspace_id", requestedWorkspaceId);
  }

  const { data: memberships } = await memberQuery.limit(1);
  const membership = memberships?.[0] as
    | { role: WorkspaceRole; workspace_id: string; workspaces: Workspace | null }
    | undefined;

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile ?? null,
    workspace: membership?.workspaces ?? null,
    role: membership?.role ?? null,
  };
}

/**
 * Enforces server-side authentication, workspace membership, and role authorization.
 * Never relies on client-side filtering.
 */
export async function requireWorkspaceAccess(
  allowedRoles: WorkspaceRole[] = ["owner", "admin", "agent"],
  requestedWorkspaceId?: string | null
): Promise<
  | { ok: true; context: AuthenticatedContext & { workspace: Workspace; role: WorkspaceRole } }
  | { ok: false; status: 401 | 403 | 404; error: string }
> {
  const ctx = await getAuthenticatedContext(requestedWorkspaceId);
  if (!ctx) {
    return { ok: false, status: 401, error: "Authentication required." };
  }
  if (!ctx.workspace || !ctx.role) {
    return { ok: false, status: 404, error: "No workspace found for this account." };
  }
  if (!hasRequiredRole(ctx.role, allowedRoles)) {
    return {
      ok: false,
      status: 403,
      error: "You do not have permission to perform this action in this workspace.",
    };
  }
  return {
    ok: true,
    context: {
      ...ctx,
      workspace: ctx.workspace,
      role: ctx.role,
    },
  };
}

const DEFAULT_PLATFORM_OWNER_EMAIL = "ekechristopher56@gmail.com";

/**
 * Checks whether an email belongs to an authorized Harmek AI platform owner.
 * Additional owners may only be granted by the owner via the server-only
 * PLATFORM_OWNER_EMAILS environment variable + database is_platform_admin flag.
 */
export function isAuthorizedPlatformOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const configured = (process.env.PLATFORM_OWNER_EMAILS ?? DEFAULT_PLATFORM_OWNER_EMAIL)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(normalized);
}

/**
 * Enforces platform administrator authorization for /admin routes and APIs.
 * Requires BOTH database is_platform_admin = true AND server-side owner email allowlist.
 */
export async function requirePlatformAdmin(): Promise<
  | { ok: true; context: AuthenticatedContext }
  | { ok: false; status: 401 | 403; error: string }
> {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return { ok: false, status: 401, error: "Authentication required." };
  }
  if (!ctx.profile?.is_platform_admin || !isAuthorizedPlatformOwnerEmail(ctx.email)) {
    return { ok: false, status: 403, error: "Platform administrator privileges required." };
  }
  return { ok: true, context: ctx };
}
