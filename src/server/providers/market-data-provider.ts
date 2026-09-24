import { serverEnv } from "@/lib/env.server"
import { mockMarketDataAdapter } from "@/server/providers/adapters/mock/mock-market-data.adapter"
import { finnhubMarketDataAdapter } from "@/server/providers/adapters/finnhub/finnhub-market-data.adapter"
import { ngnMarketMarketDataAdapter } from "@/server/providers/adapters/ngn-market/ngn-market-market-data.adapter"
import type {
  LiveNewsItem,
  LiveQuote,
  MarketDataProvider,
  ResolvedSecurity,
  SecurityRef,
  SymbolSearchResult,
} from "@/server/providers/ports/market-data.port"
import * as providerCacheRepo from "@/server/repositories/provider-cache.repository"

// Cache TTLs are deliberately conservative — NGN Market's free tier is
// 3,000 calls/month (roughly 100/day) and 30/min; without caching, a
// handful of people loading the watchlist a few times would exhaust the
// monthly quota in hours. Quotes refresh often enough to feel "live"
// without burning quota; news changes slowly enough that an hour is fine.
const QUOTE_CACHE_MS = 5 * 60 * 1000
const NEWS_CACHE_MS = 60 * 60 * 1000

/**
 * The ONLY module outside src/server/providers/ that should ever be
 * imported for market data. Routes each request to whichever adapter
 * covers that security's exchange (NGX -> NGN Market, everything else
 * Finnhub today), and falls back to mock data whenever the live adapter
 * can't serve it (wrong market, free-tier plan restriction, API error) —
 * callers never see the difference, they just get a result or null.
 *
 * Adding a second NGX source later (e.g. iTick as a supplement or
 * replacement for NGN Market) means adding one more adapter here and
 * changing this file only — no repository, service, or UI code changes.
 */
const NGX_EXCHANGES = new Set(["NGX"])

function pickLiveAdapter(
  security: SecurityRef
): { adapter: MarketDataProvider; name: string } | null {
  if (NGX_EXCHANGES.has(security.exchange)) {
    return { adapter: ngnMarketMarketDataAdapter, name: "ngn_market" }
  }
  return { adapter: finnhubMarketDataAdapter, name: "finnhub" }
}

/** Tries the live (cached) adapter for this security; returns null — never
 * mock data — when live has nothing. Whether "nothing" should become a
 * mock fallback is a decision each port method below makes explicitly,
 * not something buried in here, since the right answer differs: a quote
 * tile always wants *a* number, while news.service.ts already has its own
 * richer (sector-aware) mock fallback and would double-count articles if
 * this also silently substituted mock ones in under a "live" label. */
async function tryLive<T>(
  security: SecurityRef,
  dataType: string,
  cacheMs: number,
  call: (adapter: MarketDataProvider) => Promise<T | null>
): Promise<T | null> {
  if (serverEnv.PROVIDER_MODE !== "live") return null

  const picked = pickLiveAdapter(security)
  if (!picked) return null

  const cacheKey = `${picked.name}:${security.ticker}`
  const cached = await providerCacheRepo.getCached<T>(
    picked.name,
    dataType,
    cacheKey,
    cacheMs
  )
  if (cached !== null) return cached

  const result = await call(picked.adapter).catch(() => null)
  if (result !== null) {
    await providerCacheRepo.setCached(
      picked.name,
      dataType,
      cacheKey,
      result,
      "current"
    )
  }
  return result
}

export const marketDataProvider: MarketDataProvider = {
  async getQuote(security: SecurityRef): Promise<LiveQuote | null> {
    const live = await tryLive(security, "quote", QUOTE_CACHE_MS, (adapter) =>
      adapter.getQuote(security)
    )
    return live ?? mockMarketDataAdapter.getQuote(security)
  },
  getCompanyNews(
    security: SecurityRef,
    limit?: number
  ): Promise<LiveNewsItem[] | null> {
    return tryLive(security, "news", NEWS_CACHE_MS, (adapter) =>
      adapter.getCompanyNews(security, limit)
    )
  },

  // Unused directly — search/resolve aren't tied to one security's
  // exchange (that's the whole point, we don't know it yet), so they're
  // exposed as the standalone functions below instead of through this
  // per-security-routed object. Present here only to satisfy the
  // MarketDataProvider interface each adapter implements.
  searchSymbols: () => Promise.resolve(null),
  resolveSecurity: () => Promise.resolve(null),
}

/**
 * Searches every live provider's full universe in parallel (not just
 * securities already in our DB) — this is what lets a user find "Tesla" or
 * any other real ticker instead of only the ~15 seeded fixtures. No-ops to
 * [] in mock mode or for an empty query rather than hitting either API.
 */
export async function searchSecuritiesAcrossProviders(
  query: string
): Promise<SymbolSearchResult[]> {
  if (serverEnv.PROVIDER_MODE !== "live" || !query.trim()) return []

  const [ngnResults, finnhubResults] = await Promise.all([
    ngnMarketMarketDataAdapter.searchSymbols(query).catch(() => null),
    finnhubMarketDataAdapter.searchSymbols(query).catch(() => null),
  ])

  return [...(ngnResults ?? []), ...(finnhubResults ?? [])]
}

/** Full profile lookup for one search result the user actually picked,
 * right before it's inserted as a new securities row — see
 * SymbolSearchResult.source on why the caller already knows which
 * adapter to ask. */
export async function resolveSecurityFromProvider(
  source: "finnhub" | "ngn_market",
  ticker: string
): Promise<ResolvedSecurity | null> {
  if (serverEnv.PROVIDER_MODE !== "live") return null

  const adapter =
    source === "finnhub" ? finnhubMarketDataAdapter : ngnMarketMarketDataAdapter
  return adapter.resolveSecurity(ticker).catch(() => null)
}
