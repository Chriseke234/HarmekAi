-- ============================================================================
-- Harmek AI — Strict Owner-Only Platform Admin Lock
-- Ensures ONLY ekechristopher56@gmail.com holds platform admin privileges
-- unless explicitly promoted by the owner via database service role.
-- ============================================================================

-- 1. Reset platform admin flag on all non-owner accounts and grant to official owner email
update public.profiles
set is_platform_admin = (lower(email) = 'ekechristopher56@gmail.com');

-- 2. Automatically grant platform admin on signup ONLY to the official owner email
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, is_platform_admin)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    lower(coalesce(new.email, '')) = 'ekechristopher56@gmail.com'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Hard trigger preventing any authenticated or anon client from escalating is_platform_admin
create or replace function public.prevent_admin_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') and new.is_platform_admin is distinct from old.is_platform_admin then
    raise exception 'Unauthorized: platform admin privileges cannot be modified by client users.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_admin_self_escalation on public.profiles;
create trigger trg_prevent_admin_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_admin_self_escalation();
