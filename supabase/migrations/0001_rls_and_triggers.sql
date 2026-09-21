-- Run this in the Supabase SQL Editor AFTER `npm run db:migrate` has created
-- the base tables. Drizzle's own migration files only manage table shape; RLS
-- policies and triggers on auth.users are intentionally handled here by hand
-- since Drizzle cannot express them.
--
-- Note on defense in depth: the app's Drizzle connection uses a Postgres role
-- that bypasses RLS (Supabase's default `postgres`/pooler role), so these
-- policies are NOT the primary access control for the app itself — every
-- repository query still filters explicitly by `userId` in application code.
-- RLS here is a backstop against any other access path (e.g. the Supabase
-- client library queried directly with a user's JWT from the browser).

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, base_currency, timezone)
  values (new.id, 'NGN', 'Africa/Lagos');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_categories enable row level security;
alter table public.provider_cache enable row level security;
alter table public.audit_log enable row level security;

-- profiles: a user can only see/edit their own profile row
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- accounts / transactions / budgets: standard user_id ownership
create policy "accounts_all_own" on public.accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "transactions_all_own" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "budgets_all_own" on public.budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- categories: everyone can read system categories (user_id is null) plus
-- their own; only their own rows can be modified
create policy "categories_select_own_or_system" on public.categories
  for select using (user_id = auth.uid() or user_id is null);
create policy "categories_modify_own" on public.categories
  for insert with check (user_id = auth.uid());
create policy "categories_update_own" on public.categories
  for update using (user_id = auth.uid());
create policy "categories_delete_own" on public.categories
  for delete using (user_id = auth.uid());

-- budget_categories: ownership is via the parent budget
create policy "budget_categories_all_own" on public.budget_categories
  for all using (
    exists (
      select 1 from public.budgets b
      where b.id = budget_categories.budget_id and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.budgets b
      where b.id = budget_categories.budget_id and b.user_id = auth.uid()
    )
  );

-- provider_cache: shared read-only cache, no user-scoped ownership; only the
-- service role (which bypasses RLS) writes to it, everyone authenticated can read
create policy "provider_cache_select_all" on public.provider_cache
  for select using (auth.role() = 'authenticated');

-- audit_log: a user may read their own audit trail, never anyone else's;
-- writes only ever happen server-side via the service role
create policy "audit_log_select_own" on public.audit_log
  for select using (user_id = auth.uid());
