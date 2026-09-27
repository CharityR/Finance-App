-- Closes a gap the Security Advisor flagged: RLS was only ever set up for
-- the original Phase-1 tables in 0001_rls_and_triggers.sql. Goals (Phase 2),
-- Investments (Phase 3), and Notifications (Phase 6) added their own tables
-- in schema.ts later but never got a matching RLS migration. Same
-- convention as 0001/0002: Drizzle owns table shape, RLS is hand-maintained
-- here since Drizzle cannot express it. Same defense-in-depth caveat as
-- 0001 — the app's own Drizzle connection bypasses RLS; this is a backstop
-- against any other access path.

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.securities enable row level security;
alter table public.dividend_event enable row level security;
alter table public.holdings enable row level security;
alter table public.price_snapshot enable row level security;
alter table public.news_item enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

-- goals / holdings / watchlist_items / notifications / notification_preferences:
-- standard user_id ownership, same shape as accounts/transactions/budgets in 0001.
create policy "goals_all_own" on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "holdings_all_own" on public.holdings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "watchlist_items_all_own" on public.watchlist_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notifications_all_own" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notification_preferences_all_own" on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- goal_contributions: ownership is via the parent goal, same pattern as
-- budget_categories -> budgets in 0001.
create policy "goal_contributions_all_own" on public.goal_contributions
  for all using (
    exists (
      select 1 from public.goals g
      where g.id = goal_contributions.goal_id and g.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.goals g
      where g.id = goal_contributions.goal_id and g.user_id = auth.uid()
    )
  );

-- securities / price_snapshot / dividend_event / news_item: shared reference
-- data, not user-scoped — same read-only shape as provider_cache in 0001.
-- Only the service role (which bypasses RLS) writes to them.
create policy "securities_select_all" on public.securities
  for select using (auth.role() = 'authenticated');

create policy "price_snapshot_select_all" on public.price_snapshot
  for select using (auth.role() = 'authenticated');

create policy "dividend_event_select_all" on public.dividend_event
  for select using (auth.role() = 'authenticated');

create policy "news_item_select_all" on public.news_item
  for select using (auth.role() = 'authenticated');
