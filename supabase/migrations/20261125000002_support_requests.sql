-- ============================================================================
-- Harmek AI — Public Contact & Support Requests Table
-- Accessible for writes via server-side API (/api/support) and reads only by
-- Platform Administrators.
-- ============================================================================

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  topic text not null default 'General Support',
  business_name text,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_support_requests_created
  on public.support_requests(created_at desc);

alter table public.support_requests enable row level security;

create policy "support_requests_admin_read" on public.support_requests
  for select using (public.is_platform_admin());
