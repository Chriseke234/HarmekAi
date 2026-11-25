-- ============================================================================
-- Sage AI — Multi-Tenant Row Level Security (RLS) Policies
-- Enforces strict workspace isolation at the PostgreSQL layer.
-- ============================================================================

-- Helper: checks if the current authenticated user belongs to a workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

-- Helper: checks if the current authenticated user holds one of the allowed roles
create or replace function public.has_workspace_role(ws_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

-- Helper: checks if the current authenticated user is a platform administrator
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_platform_admin = true
  );
$$;

-- Enable RLS across all tables
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.business_profiles enable row level security;
alter table public.assistants enable row level security;
alter table public.assistant_settings enable row level security;
alter table public.workspace_ai_credentials enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.faqs enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_assignments enable row level security;
alter table public.internal_notes enable row level security;
alter table public.automations enable row level security;
alter table public.automation_executions enable row level security;
alter table public.integrations enable row level security;
alter table public.trial_records enable row level security;
alter table public.subscription_records enable row level security;
alter table public.usage_records enable row level security;
alter table public.unanswered_questions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.notifications enable row level security;
alter table public.system_error_logs enable row level security;

-- PROFILES
create policy "profiles_select_own_or_teammate" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_platform_admin()
    or exists (
      select 1 from public.workspace_members m1
      join public.workspace_members m2 on m1.workspace_id = m2.workspace_id
      where m1.user_id = auth.uid() and m2.user_id = profiles.id
    )
  );

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and is_platform_admin = (select is_platform_admin from public.profiles where id = auth.uid()));

-- WORKSPACES
create policy "workspaces_select_member" on public.workspaces
  for select using (public.is_workspace_member(id) or public.is_platform_admin());

create policy "workspaces_insert_authenticated" on public.workspaces
  for insert with check (auth.uid() = owner_id);

create policy "workspaces_update_admin" on public.workspaces
  for update using (public.has_workspace_role(id, array['owner', 'admin']));

-- WORKSPACE MEMBERS
create policy "workspace_members_select" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "workspace_members_insert_owner_admin" on public.workspace_members
  for insert with check (
    public.has_workspace_role(workspace_id, array['owner', 'admin'])
    or (user_id = auth.uid() and role = 'owner' and exists (
      select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
    ))
  );

create policy "workspace_members_update_owner_admin" on public.workspace_members
  for update using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "workspace_members_delete_owner_admin" on public.workspace_members
  for delete using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- WORKSPACE INVITATIONS
create policy "invitations_select_admin" on public.workspace_invitations
  for select using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "invitations_manage_admin" on public.workspace_invitations
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- BUSINESS PROFILES
create policy "business_profiles_select" on public.business_profiles
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "business_profiles_manage" on public.business_profiles
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- ASSISTANTS & SETTINGS
create policy "assistants_select" on public.assistants
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "assistants_manage" on public.assistants
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "assistant_settings_select" on public.assistant_settings
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "assistant_settings_manage" on public.assistant_settings
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- WORKSPACE AI CREDENTIALS: Intentionally NO anon/authenticated policies.
-- Only accessed server-side via Supabase Service Role after authorization checks.

-- KNOWLEDGE BASE (products, services, faqs, knowledge_sources, knowledge_chunks)
create policy "products_select" on public.products
  for select using (public.is_workspace_member(workspace_id));
create policy "products_manage" on public.products
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "services_select" on public.services
  for select using (public.is_workspace_member(workspace_id));
create policy "services_manage" on public.services
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "faqs_select" on public.faqs
  for select using (public.is_workspace_member(workspace_id));
create policy "faqs_manage" on public.faqs
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'agent']));

create policy "knowledge_sources_select" on public.knowledge_sources
  for select using (public.is_workspace_member(workspace_id));
create policy "knowledge_sources_manage" on public.knowledge_sources
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "knowledge_chunks_select" on public.knowledge_chunks
  for select using (public.is_workspace_member(workspace_id));
create policy "knowledge_chunks_manage" on public.knowledge_chunks
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- CONTACTS, CONVERSATIONS, MESSAGES, ASSIGNMENTS, NOTES (owner, admin, agent)
create policy "contacts_member_all" on public.contacts
  for all using (public.is_workspace_member(workspace_id));

create policy "conversations_member_all" on public.conversations
  for all using (public.is_workspace_member(workspace_id));

create policy "messages_member_all" on public.messages
  for all using (public.is_workspace_member(workspace_id));

create policy "assignments_member_all" on public.conversation_assignments
  for all using (public.is_workspace_member(workspace_id));

create policy "internal_notes_member_all" on public.internal_notes
  for all using (public.is_workspace_member(workspace_id));

-- AUTOMATIONS & INTEGRATIONS
create policy "automations_select" on public.automations
  for select using (public.is_workspace_member(workspace_id));
create policy "automations_manage" on public.automations
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "automation_executions_select" on public.automation_executions
  for select using (public.is_workspace_member(workspace_id));
create policy "automation_executions_insert" on public.automation_executions
  for insert with check (public.is_workspace_member(workspace_id));

create policy "integrations_select" on public.integrations
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "integrations_manage" on public.integrations
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- TRIALS, SUBSCRIPTIONS, USAGE, ANALYTICS, UNANSWERED QUESTIONS, NOTIFICATIONS
create policy "trial_records_select" on public.trial_records
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "trial_records_manage" on public.trial_records
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "subscription_records_select" on public.subscription_records
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "subscription_records_manage" on public.subscription_records
  for all using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

create policy "usage_records_select" on public.usage_records
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "unanswered_questions_member_all" on public.unanswered_questions
  for all using (public.is_workspace_member(workspace_id));

create policy "analytics_events_select" on public.analytics_events
  for select using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "notifications_member_all" on public.notifications
  for all using (public.is_workspace_member(workspace_id));

-- SYSTEM ERROR LOGS: Platform Admins Only
create policy "system_error_logs_admin_only" on public.system_error_logs
  for select using (public.is_platform_admin());
