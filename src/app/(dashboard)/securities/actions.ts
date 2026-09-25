"use server"

import * as securitiesService from "@/server/services/securities.service"
import { createClient } from "@/server/supabase/server"

async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
}

/** Backs the security search box in HoldingForm/WatchlistForm — merges our
 * DB with a live search across every provider, so any real ticker is
 * findable, not just the pre-seeded fixtures. */
export async function searchSecuritiesAction(query: string) {
  await requireAuth()
  return securitiesService.searchSecurities(query)
}

/** Called once, when a user picks a live-only search result, to create its
 * securities row before the holding/watchlist entry that references it.
 * Returns a result rather than throwing — see resolveOrCreateSecurity. */
export async function resolveSecurityAction(
  ticker: string,
  source: "finnhub" | "ngn_market"
) {
  await requireAuth()
  return securitiesService.resolveOrCreateSecurity(ticker, source)
}
