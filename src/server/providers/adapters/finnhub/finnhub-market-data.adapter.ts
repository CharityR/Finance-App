import { serverEnv } from "@/lib/env.server"
import type {
  LiveNewsItem,
  LiveQuote,
  MarketDataProvider,
  ResolvedSecurity,
  SecurityRef,
  SymbolSearchResult,
} from "@/server/providers/ports/market-data.port"

const BASE_URL = "https://finnhub.io/api/v1"

/**
 * Finnhub free tier (verified against the live API, not just docs):
 *   - /quote            -> works. Real-time-ish price + % change.
 *   - /company-news     -> works. Recent headlines with source + URL.
 *   - /stock/candle     -> 403 "You don't have access to this resource."
 *   - /stock/dividend   -> 403, same message.
 * So this adapter only implements getQuote and getCompanyNews — there is no
 * free-tier historical-chart or dividend capability to add here, on this
 * provider, without upgrading the plan (see docs/market-data-providers.md).
 * 60 requests/minute (confirmed via the x-ratelimit-limit response header).
 */

type FinnhubQuote = {
  c: number // current price
  dp: number | null // percent change
  t: number // unix seconds
}

async function finnhubGet<T>(path: string, params: Record<string, string>) {
  if (!serverEnv.FINNHUB_API_KEY) return null

  const url = new URL(`${BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value)
  url.searchParams.set("token", serverEnv.FINNHUB_API_KEY)

  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) return null

  const body = (await res.json()) as T | { error: string }
  if (body && typeof body === "object" && "error" in body) return null
  return body as T
}

// Finnhub covers non-NGX exchanges only; the router decides who gets asked.
const SUPPORTED_EXCHANGES = new Set(["NASDAQ", "NYSE", "NYSEARCA"])

/** Finnhub's /stock/profile2 returns verbose exchange names ("NASDAQ NMS -
 * GLOBAL MARKET") — normalize to the short codes SUPPORTED_EXCHANGES (and
 * the rest of the app) actually use, or the security we create would never
 * match its own adapter's exchange check. */
function normalizeExchange(raw: string): string {
  const upper = raw.toUpperCase()
  if (upper.includes("ARCA")) return "NYSEARCA"
  if (upper.includes("NASDAQ")) return "NASDAQ"
  if (upper.includes("NEW YORK STOCK EXCHANGE") || upper === "NYSE")
    return "NYSE"
  return raw
}

export const finnhubMarketDataAdapter: MarketDataProvider = {
  async getQuote(security: SecurityRef): Promise<LiveQuote | null> {
    if (!SUPPORTED_EXCHANGES.has(security.exchange)) return null

    const quote = await finnhubGet<FinnhubQuote>("/quote", {
      symbol: security.ticker,
    })
    if (!quote || quote.c === 0) return null // c:0 means "unknown symbol"

    return {
      price: quote.c,
      changePercent: quote.dp,
      currency: security.currency,
      asOf: new Date(quote.t * 1000).toISOString(),
      source: "finnhub",
    }
  },

  async getCompanyNews(
    security: SecurityRef,
    limit = 10
  ): Promise<LiveNewsItem[] | null> {
    if (!SUPPORTED_EXCHANGES.has(security.exchange)) return null

    const to = new Date()
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
    const toStr = to.toISOString().slice(0, 10)
    const fromStr = from.toISOString().slice(0, 10)

    type FinnhubNewsItem = {
      headline: string
      summary: string
      url: string
      source: string
      datetime: number
    }

    const items = await finnhubGet<FinnhubNewsItem[]>("/company-news", {
      symbol: security.ticker,
      from: fromStr,
      to: toStr,
    })
    if (!items) return null

    return items.slice(0, limit).map((item) => ({
      headline: item.headline,
      summary: item.summary || null,
      url: item.url,
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
    }))
  },

  async searchSymbols(query: string): Promise<SymbolSearchResult[] | null> {
    type FinnhubSearchResult = {
      symbol: string
      description: string
      type: string
    }

    const result = await finnhubGet<{
      count: number
      result: FinnhubSearchResult[]
    }>("/search", { q: query })
    if (!result) return null

    // Plain tickers only (no "TSLA.MX", "BRK.A"-style suffixes/dots) — cheap
    // filter to avoid surfacing every regional listing/warrant variant of
    // the same company ahead of the one a user actually means.
    return result.result
      .filter((r) => /^[A-Z]+$/.test(r.symbol))
      .slice(0, 8)
      .map((r) => ({
        ticker: r.symbol,
        name: r.description,
        // Not known until resolveSecurity() — a full profile fetch per
        // search-as-you-type keystroke isn't worth the extra API calls.
        exchange: null,
        currency: null,
        country: null,
        sector: null,
        assetClass: /etf|etp/i.test(r.type) ? "etf" : null,
        source: "finnhub" as const,
      }))
  },

  async resolveSecurity(ticker: string): Promise<ResolvedSecurity | null> {
    type FinnhubProfile = {
      ticker: string
      name: string
      exchange: string
      currency: string
      country: string
      finnhubIndustry: string | null
    }

    const profile = await finnhubGet<FinnhubProfile>("/stock/profile2", {
      symbol: ticker,
    })
    if (profile && profile.name) {
      return {
        ticker: profile.ticker,
        name: profile.name,
        exchange: normalizeExchange(profile.exchange),
        currency: profile.currency,
        country: profile.country,
        sector: profile.finnhubIndustry,
        assetClass: "stock",
      }
    }

    // /stock/profile2 only covers individual company stocks on the free
    // tier — it comes back as {} for every ETF (VOO, VXUS, GLD, ... all
    // verified empty), with no free-tier ETF-profile endpoint to fall back
    // to (/etf/profile is 403 on this plan). /search and /quote both do
    // cover ETFs, so use those to confirm the ticker is real and get its
    // name, at the cost of exchange/country being a best-effort default
    // rather than a verified fact — Finnhub gives no free way to look up
    // an ETF's actual listing venue.
    type FinnhubSearchResult = {
      symbol: string
      description: string
      type: string
    }
    const search = await finnhubGet<{ result: FinnhubSearchResult[] }>(
      "/search",
      { q: ticker }
    )
    const match = search?.result.find((r) => r.symbol === ticker)
    if (!match) return null

    const quote = await finnhubGet<FinnhubQuote>("/quote", { symbol: ticker })
    if (!quote || quote.c === 0) return null

    return {
      ticker,
      name: match.description,
      exchange: "NYSEARCA",
      currency: "USD",
      country: "US",
      sector: null,
      assetClass: /etf|etp/i.test(match.type) ? "etf" : "stock",
    }
  },
}
