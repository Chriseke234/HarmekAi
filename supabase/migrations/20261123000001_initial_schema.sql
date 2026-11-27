-- ============================================================================
-- Harmek AI — Initial Multi-Tenant PostgreSQL Schema
-- Standalone Customer Engagement Platform by ChrisBuilds
-- ============================================================================

create extension if not exists "pgcrypto";

-- Generic updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. IDENTITY, WORKSPACES & MEMBERSHIP
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  avatar_url text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Automatically create a profile row when a new Supabase Auth user signs up
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  widget_key text not null unique default encode(gen_random_bytes(16), 'hex'),
  onboarding_completed boolean not null default false,
  onboarding_step integer not null default 1 check (onboarding_step between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workspaces_owner_id on public.workspaces(owner_id);
create index idx_workspaces_widget_key on public.workspaces(widget_key);

create trigger trg_workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'agent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index idx_workspace_members_user_id on public.workspace_members(user_id);
create index idx_workspace_members_workspace_id on public.workspace_members(workspace_id);

create trigger trg_workspace_members_updated_at
  before update on public.workspace_members
  for each row execute function public.set_updated_at();

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'agent')),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index idx_workspace_invitations_workspace_id on public.workspace_invitations(workspace_id);

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  business_name text not null,
  industry text not null default 'General',
  description text not null default '',
  website text,
  business_email text,
  business_phone text,
  country text,
  location_address text,
  currency text not null default 'USD',
  operating_hours jsonb not null default '{}'::jsonb,
  delivery_info text not null default '',
  booking_info text not null default '',
  return_policy text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_business_profiles_updated_at
  before update on public.business_profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 2. AI ASSISTANT & DUAL INTELLIGENCE CONFIGURATION
-- ============================================================================

create table if not exists public.assistants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  name text not null default 'Harmek',
  avatar_url text,
  is_active boolean not null default false,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_assistants_updated_at
  before update on public.assistants
  for each row execute function public.set_updated_at();

create table if not exists public.assistant_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  assistant_id uuid not null unique references public.assistants(id) on delete cascade,
  tone text not null default 'friendly' check (tone in ('friendly', 'professional', 'conversational', 'luxury', 'supportive', 'custom')),
  custom_tone_notes text not null default '',
  formality text not null default 'balanced' check (formality in ('casual', 'balanced', 'formal')),
  response_length text not null default 'concise' check (response_length in ('brief', 'concise', 'detailed')),
  welcome_message text not null default 'Hello! How can I help you today?',
  supported_languages text[] not null default array['English'],
  business_objectives text not null default '',
  allowed_topics text[] not null default array[]::text[],
  avoided_topics text[] not null default array[]::text[],
  lead_capture_fields text[] not null default array['name', 'email'],
  clarification_enabled boolean not null default true,
  auto_answer_threshold numeric(3,2) not null default 0.65 check (auto_answer_threshold between 0.20 and 0.95),
  clarification_threshold numeric(3,2) not null default 0.35 check (clarification_threshold between 0.10 and 0.80),
  escalation_keywords text[] not null default array['human', 'agent', 'manager', 'representative', 'speak to someone', 'complaint', 'refund dispute'],
  max_consecutive_fallbacks integer not null default 2 check (max_consecutive_fallbacks between 1 and 5),
  intelligence_mode text not null default 'native' check (intelligence_mode in ('native', 'enhanced')),
  enhanced_provider text check (enhanced_provider in ('openai', 'anthropic', 'gemini')),
  enhanced_model text,
  widget_primary_color text not null default '#121212',
  widget_position text not null default 'bottom-right' check (widget_position in ('bottom-right', 'bottom-left')),
  widget_require_consent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_assistant_settings_updated_at
  before update on public.assistant_settings
  for each row execute function public.set_updated_at();

-- Server-only encrypted storage for optional workspace LLM provider keys
-- RLS enabled with NO policies for anon/authenticated roles.
create table if not exists public.workspace_ai_credentials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('openai', 'anthropic', 'gemini')),
  encrypted_api_key text not null,
  key_last_four text not null,
  is_verified boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

create trigger trg_workspace_ai_credentials_updated_at
  before update on public.workspace_ai_credentials
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 3. STRUCTURED KNOWLEDGE BASE
-- ============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(12,2),
  currency text not null default 'USD',
  category text not null default 'General',
  availability text not null default 'in_stock' check (availability in ('in_stock', 'out_of_stock', 'preorder', 'limited')),
  sku text,
  keywords text[] not null default array[]::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_workspace_id on public.products(workspace_id);
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(12,2),
  currency text not null default 'USD',
  duration_label text,
  category text not null default 'General',
  booking_required boolean not null default false,
  keywords text[] not null default array[]::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_workspace_id on public.services(workspace_id);
create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  question text not null,
  answer text not null,
  category text not null default 'General',
  keywords text[] not null default array[]::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_faqs_workspace_id on public.faqs(workspace_id);
create trigger trg_faqs_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_type text not null check (source_type in ('policy', 'delivery', 'booking', 'business_info', 'document', 'url')),
  title text not null,
  category text not null default 'General',
  content text not null default '',
  source_url text,
  content_hash text,
  status text not null default 'indexed' check (status in ('pending', 'processing', 'indexed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_knowledge_sources_workspace_id on public.knowledge_sources(workspace_id);
create index idx_knowledge_sources_hash on public.knowledge_sources(workspace_id, content_hash);
create trigger trg_knowledge_sources_updated_at
  before update on public.knowledge_sources
  for each row execute function public.set_updated_at();

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  chunk_index integer not null default 0,
  content text not null,
  token_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_knowledge_chunks_workspace_id on public.knowledge_chunks(workspace_id);
create index idx_knowledge_chunks_source_id on public.knowledge_chunks(source_id);

-- ============================================================================
-- 4. CONTACTS, CONVERSATIONS & HUMAN HANDOFF
-- ============================================================================

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  visitor_token text,
  full_name text,
  email text,
  phone text,
  tags text[] not null default array[]::text[],
  notes text not null default '',
  consent_preferences jsonb not null default '{"chat_persistence": false, "follow_up_messages": false}'::jsonb,
  first_interaction_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_workspace_id on public.contacts(workspace_id);
create index idx_contacts_visitor_token on public.contacts(workspace_id, visitor_token);
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  channel text not null default 'website' check (channel in ('website', 'whatsapp', 'instagram', 'messenger', 'simulator')),
  status text not null default 'ai_handling' check (status in ('open', 'ai_handling', 'waiting_for_human', 'assigned', 'resolved')),
  human_takeover boolean not null default false,
  assigned_to uuid references public.profiles(id) on delete set null,
  subject text,
  category text,
  summary text,
  unread_count integer not null default 0,
  lead_captured boolean not null default false,
  sale_completed boolean not null default false,
  first_response_ms integer,
  state_context jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversations_workspace_id on public.conversations(workspace_id);
create index idx_conversations_status on public.conversations(workspace_id, status);
create index idx_conversations_last_message_at on public.conversations(workspace_id, last_message_at desc);
create trigger trg_conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'assistant', 'agent', 'system')),
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  intelligence_mode text check (intelligence_mode in ('native', 'enhanced')),
  intent text,
  confidence numeric(4,3),
  knowledge_source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation_id on public.messages(conversation_id, created_at asc);
create index idx_messages_workspace_id on public.messages(workspace_id);

create table if not exists public.conversation_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  assigned_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index idx_conversation_assignments_conv on public.conversation_assignments(conversation_id);

create table if not exists public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_internal_notes_conv on public.internal_notes(conversation_id, created_at desc);

-- ============================================================================
-- 5. AUTOMATIONS & INTEGRATIONS
-- ============================================================================

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_key text not null,
  name text not null,
  description text not null default '',
  trigger_event text not null check (trigger_event in ('conversation_started', 'message_received', 'unanswered_question', 'human_handoff', 'lead_captured', 'conversation_idle')),
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, template_key)
);

create index idx_automations_workspace_id on public.automations(workspace_id);
create trigger trg_automations_updated_at
  before update on public.automations
  for each row execute function public.set_updated_at();

create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  automation_id uuid not null references public.automations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  status text not null check (status in ('executed', 'skipped', 'failed')),
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  executed_at timestamptz not null default now()
);

create index idx_automation_executions_workspace on public.automation_executions(workspace_id, executed_at desc);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('website_widget', 'whatsapp', 'instagram', 'messenger', 'webhook')),
  status text not null default 'disconnected' check (status in ('disconnected', 'pending_verification', 'connected', 'error')),
  public_config jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

create index idx_integrations_workspace_id on public.integrations(workspace_id);
create trigger trg_integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 6. TRIALS, SUBSCRIPTIONS, USAGE, ANALYTICS & OPS
-- ============================================================================

create table if not exists public.trial_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'active', 'expired', 'converted')),
  duration_days integer not null default 14,
  activated_at timestamptz,
  expires_at timestamptz,
  conversation_limit integer not null default 500,
  message_limit integer not null default 2500,
  notified_expiring_3d boolean not null default false,
  notified_expiring_1d boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_trial_records_updated_at
  before update on public.trial_records
  for each row execute function public.set_updated_at();

create table if not exists public.subscription_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  plan_tier text not null default 'trial' check (plan_tier in ('trial', 'starter', 'growth', 'scale')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  billing_provider text,
  external_customer_id text,
  external_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_subscription_records_updated_at
  before update on public.subscription_records
  for each row execute function public.set_updated_at();

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  metric_type text not null check (metric_type in ('conversation', 'native_message', 'enhanced_message', 'kb_document')),
  intelligence_mode text check (intelligence_mode in ('native', 'enhanced')),
  quantity integer not null default 1,
  tokens_used integer not null default 0,
  estimated_cost_usd numeric(10,6) not null default 0,
  recorded_at timestamptz not null default now()
);

create index idx_usage_records_workspace on public.usage_records(workspace_id, recorded_at desc);

create table if not exists public.unanswered_questions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  question text not null,
  detected_intent text,
  confidence numeric(4,3),
  status text not null default 'open' check (status in ('open', 'resolved_in_kb', 'dismissed')),
  created_at timestamptz not null default now()
);

create index idx_unanswered_questions_workspace on public.unanswered_questions(workspace_id, status, created_at desc);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_analytics_events_workspace on public.analytics_events(workspace_id, event_type, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  recipient_user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_notifications_workspace on public.notifications(workspace_id, is_read, created_at desc);

create table if not exists public.system_error_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  component text not null,
  severity text not null default 'error' check (severity in ('warn', 'error', 'critical')),
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_system_error_logs_created on public.system_error_logs(created_at desc);
