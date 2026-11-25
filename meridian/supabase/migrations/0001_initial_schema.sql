-- ============================================================================
-- Meridian: AI-Native Professional Network
-- Migration 0001: Core Schema, pgvector Embeddings, and Row-Level Security
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ----------------------------------------------------------------------------
-- 1. PROFILES (Proof-of-Work Identity)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  full_name text not null,
  headline text not null default '',
  bio text not null default '',
  location text not null default '',
  avatar_url text,
  cover_url text,
  open_to_work boolean not null default false,
  work_email_verified boolean not null default false,
  verified_domain text,
  profile_embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handle_format check (handle ~ '^[a-z0-9][a-z0-9-]{2,38}[a-z0-9]$')
);

create index if not exists idx_profiles_handle on public.profiles(handle);
create index if not exists idx_profiles_open_to_work on public.profiles(open_to_work) where open_to_work = true;

-- ----------------------------------------------------------------------------
-- 2. EXPERIENCES
-- ----------------------------------------------------------------------------
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  title text not null,
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time', 'part_time', 'contract', 'freelance', 'internship')),
  location text not null default '',
  start_date date not null,
  end_date date,
  summary text not null default '',
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_experiences_profile on public.experiences(profile_id, display_order);

-- ----------------------------------------------------------------------------
-- 3. PROOF-OF-WORK ARTIFACTS
-- ----------------------------------------------------------------------------
create table if not exists public.proof_artifacts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  artifact_type text not null
    check (artifact_type in ('repo', 'case_study', 'publication', 'live_product', 'design')),
  title text not null,
  url text not null,
  summary text not null default '',
  skills_tags text[] not null default '{}',
  verified_source text,
  thumbnail_url text,
  metrics_label text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_artifacts_profile on public.proof_artifacts(profile_id, display_order);

-- ----------------------------------------------------------------------------
-- 4. PROFILE SKILLS (Linked to Verifiable Artifacts)
-- ----------------------------------------------------------------------------
create table if not exists public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_name text not null,
  proficiency text not null default 'proficient'
    check (proficiency in ('working', 'proficient', 'expert')),
  linked_artifact_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (profile_id, skill_name)
);

-- ----------------------------------------------------------------------------
-- 5. ORGANISATIONS & RBAC MEMBERS (Open Verified Company Hubs)
-- ----------------------------------------------------------------------------
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain text not null unique,
  domain_verified boolean not null default false,
  industry text not null default '',
  size_band text not null default '11-50',
  hq_location text not null default '',
  logo_url text,
  cover_url text,
  description text not null default '',
  avg_response_hours int not null default 48,
  response_rate_pct int not null default 90 check (response_rate_pct between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id uuid not null references public.organisations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('super_admin', 'hiring_manager', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, profile_id)
);

-- ----------------------------------------------------------------------------
-- 6. VERIFIED TRANSPARENT JOBS (Mandatory Salary & 30-Day Freshness)
-- ----------------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  posted_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null,
  workplace_type text not null check (workplace_type in ('remote', 'hybrid', 'onsite')),
  employment_type text not null check (employment_type in ('full_time', 'contract', 'part_time', 'internship')),
  experience_level text not null check (experience_level in ('entry', 'mid', 'senior', 'lead', 'executive')),
  location text not null,
  salary_min int not null check (salary_min > 0),
  salary_max int not null check (salary_max >= salary_min),
  salary_currency text not null default 'USD',
  required_skills text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'paused', 'closed', 'expired')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  job_embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_active on public.jobs(status, expires_at desc) where status = 'active';
create index if not exists idx_jobs_org on public.jobs(org_id);
create index if not exists idx_jobs_salary on public.jobs(salary_min, salary_max);

-- ----------------------------------------------------------------------------
-- 7. SMART MATCH APPLICATIONS
-- ----------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  cv_storage_path text,
  selected_artifact_ids uuid[] not null default '{}',
  cover_note text not null default '',
  ai_fit_snapshot jsonb,
  status text not null default 'applied'
    check (status in ('applied', 'viewed', 'shortlisted', 'interviewing', 'rejected', 'offer')),
  employer_responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index if not exists idx_applications_applicant on public.applications(applicant_id, created_at desc);
create index if not exists idx_applications_job on public.applications(job_id, status);

-- ----------------------------------------------------------------------------
-- 8. INTENT-TAGGED MESSAGES (No Paywalled Intro Notes)
-- ----------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  intent_tag text not null default 'general'
    check (intent_tag in ('hiring', 'collaboration', 'advice', 'general')),
  related_job_id uuid references public.jobs(id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint no_self_message check (sender_id <> recipient_id)
);

create index if not exists idx_messages_participants on public.messages(recipient_id, sender_id, created_at desc);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.experiences enable row level security;
alter table public.proof_artifacts enable row level security;
alter table public.profile_skills enable row level security;
alter table public.organisations enable row level security;
alter table public.org_members enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.messages enable row level security;

-- Public read for open discovery (profiles, artifacts, orgs, active jobs)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Experiences are viewable by everyone"
  on public.experiences for select using (true);
create policy "Users manage own experiences"
  on public.experiences for all using (auth.uid() = profile_id);

create policy "Proof artifacts are viewable by everyone"
  on public.proof_artifacts for select using (true);
create policy "Users manage own proof artifacts"
  on public.proof_artifacts for all using (auth.uid() = profile_id);

create policy "Skills are viewable by everyone"
  on public.profile_skills for select using (true);
create policy "Users manage own skills"
  on public.profile_skills for all using (auth.uid() = profile_id);

create policy "Organisations are publicly viewable"
  on public.organisations for select using (true);
create policy "Org super admins can update organisation"
  on public.organisations for update using (
    exists (
      select 1 from public.org_members m
      where m.org_id = organisations.id
        and m.profile_id = auth.uid()
        and m.role = 'super_admin'
    )
  );

create policy "Org members are viewable by everyone"
  on public.org_members for select using (true);

create policy "Active non-expired jobs are publicly viewable"
  on public.jobs for select using (status = 'active' and expires_at > now());
create policy "Org hiring managers can manage jobs"
  on public.jobs for all using (
    exists (
      select 1 from public.org_members m
      where m.org_id = jobs.org_id
        and m.profile_id = auth.uid()
        and m.role in ('super_admin', 'hiring_manager')
    )
  );

-- Applications: strictly applicant or hiring org team
create policy "Applicants and org hiring teams view applications"
  on public.applications for select using (
    auth.uid() = applicant_id
    or exists (
      select 1 from public.jobs j
      join public.org_members m on m.org_id = j.org_id
      where j.id = applications.job_id
        and m.profile_id = auth.uid()
        and m.role in ('super_admin', 'hiring_manager')
    )
  );

create policy "Applicants can submit own applications"
  on public.applications for insert with check (auth.uid() = applicant_id);

create policy "Hiring managers can update application status"
  on public.applications for update using (
    exists (
      select 1 from public.jobs j
      join public.org_members m on m.org_id = j.org_id
      where j.id = applications.job_id
        and m.profile_id = auth.uid()
        and m.role in ('super_admin', 'hiring_manager')
    )
  );

-- Messages: strict participant isolation
create policy "Participants can read their messages"
  on public.messages for select using (auth.uid() in (sender_id, recipient_id));
create policy "Authenticated users can send messages as themselves"
  on public.messages for insert with check (auth.uid() = sender_id);
create policy "Recipients can mark messages read"
  on public.messages for update using (auth.uid() = recipient_id);
