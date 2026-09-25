import * as securitiesRepo from "@/server/repositories/securities.repository"
import {
  resolveSecurityFromProvider,
  searchSecuritiesAcrossProviders,
} from "@/server/providers/market-data-provider"

export type SecuritySearchOption = {
  /** A real DB id, ready to use immediately for a holding/watchlist entry —
   * or null for a live-only result that needs resolveOrCreateSecurity()
   * first (the UI shows these the same way, just triggers that extra step
   * on select). */
  id: string | null
  ticker: string
  name: string
  currency: string | null
  exchange: string | null
  source: "local" | "finnhub" | "ngn_market"
}

/**
 * Merges our own DB (fixtures + anything previously resolved from a live
 * search) with a live search across every provider — this is what makes
 * any real ticker (not just the ~15 seeded ones) searchable. Local matches
 * take priority over a live result for the same ticker, since a local row
 * already has a stable id.
 */
export async function searchSecurities(
  query: string
): Promise<SecuritySearchOption[]> {
  const [local, live] = await Promise.all([
    securitiesRepo.searchSecurities(query),
    searchSecuritiesAcrossProviders(query),
  ])

  const localTickers = new Set(local.map((s) => s.ticker))
  const localOptions: SecuritySearchOption[] = local.map((s) => ({
    id: s.id,
    ticker: s.ticker,
    name: s.name,
    currency: s.currency,
    exchange: s.exchange,
    source: "local",
  }))

  const liveOptions: SecuritySearchOption[] = live
    .filter((r) => !localTickers.has(r.ticker))
    .map((r) => ({
      id: null,
      ticker: r.ticker,
      name: r.name,
      currency: r.currency,
      exchange: r.exchange,
      source: r.source,
    }))

  return [...localOptions, ...liveOptions].slice(0, 15)
}

export type ResolveSecurityResult =
  | {
      ok: true
      security: Awaited<ReturnType<typeof securitiesRepo.upsertSecurity>>
    }
  | { ok: false; message: string }

/**
 * Turns a live-only search result (id: null) into a real securities row,
 * or returns the existing one if it's since been added by someone else —
 * called once, right when a user picks a result to add, not per keystroke.
 *
 * Returns a result instead of throwing: this "couldn't resolve" case is an
 * expected outcome (provider has nothing for this ticker right now), not a
 * bug, and Next.js strips thrown Server Action error messages in
 * production — a thrown Error here would reach the user as an opaque
 * "Minified React error #441" instead of this message.
 */
export async function resolveOrCreateSecurity(
  ticker: string,
  source: "finnhub" | "ngn_market"
): Promise<ResolveSecurityResult> {
  const existing = await securitiesRepo.getSecurityByTicker(ticker)
  if (existing) return { ok: true, security: existing }

  const details = await resolveSecurityFromProvider(source, ticker)
  if (!details) {
    return {
      ok: false,
      message: `Could not look up ${ticker} — try again in a moment.`,
    }
  }

  return { ok: true, security: await securitiesRepo.upsertSecurity(details) }
}
