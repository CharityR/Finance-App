-- Run this in the Supabase SQL Editor AFTER `npm run db:migrate` has created
-- manual_assets, liabilities, and fx_rates (drizzle/0007_*.sql). Same
-- convention as 0001_rls_and_triggers.sql: Drizzle owns table shape, RLS is
-- hand-maintained here since Drizzle cannot express it.

alter table public.manual_assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.fx_rates enable row level security;

create policy "manual_assets_all_own" on public.manual_assets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "liabilities_all_own" on public.liabilities
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- fx_rates: shared, no user-scoped ownership, same shape as provider_cache —
-- only the service role (which bypasses RLS) writes to it, everyone
-- authenticated can read the seeded rates to convert their own figures.
create policy "fx_rates_select_all" on public.fx_rates
  for select using (auth.role() = 'authenticated');
