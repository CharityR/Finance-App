import { serverEnv } from "@/lib/env.server"
import type {
  LiveNewsItem,
  LiveQuote,
  MarketDataProvider,
  SecurityRef,
} from "@/server/providers/ports/market-data.port"

const BASE_URL = "https://api.ngnmarket.com/v1"

/**
 * NGN Market free tier (verified against the live API, not just docs):
 *   - /market/snapshot          -> works. Index-level, not per-security.
 *   - /companies?search=X       -> works. Current price + day change per
 *     company — this is the free-tier substitute for the (paid-only)
 *     /companies/{symbol} detail endpoint.
 *   - /companies/{symbol}            -> 403 PLAN_REQUIRED (needs Hobby+)
 *   - /companies/{symbol}/chart      -> 403 PLAN_REQUIRED (needs Hobby+)
 *   - /companies/{symbol}/dividends  -> needs Starter+ (not tested with a
 *     free key, but documented as Starter-minimum)
 *   - /companies/{symbol}/news       -> needs Starter+ (same)
 * So getQuote uses the list-search endpoint; getCompanyNews always returns
 * null on the free plan today, but needs no code change to start working
 * the moment the account upgrades to Starter — see docs/market-data-providers.md.
 * 30 requests/minute on Free (confirmed via docs; 3,000/month quota).
 */

type NgnMarketEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

type NgnMarketCompany = {
  symbol: string
  price: number
  price_change_percent: number
  last_updated: string
}

async function ngnMarketGet<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  if (!serverEnv.NGN_MARKET_API_KEY) return null

  const url = new URL(`${BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${serverEnv.NGN_MARKET_API_KEY}` },
    next: { revalidate: 0 },
  })
  // Plan-restricted endpoints return 403 with {success:false, error:{code:"PLAN_REQUIRED", ...}}
  // — that's an expected, routine outcome on the free tier, not a bug.
  if (!res.ok && res.status !== 403) return null

  const body = (await res.json()) as NgnMarketEnvelope<T>
  return body.success ? body.data : null
}

const SUPPORTED_EXCHANGES = new Set(["NGX"])

export const ngnMarketMarketDataAdapter: MarketDataProvider = {
  async getQuote(security: SecurityRef): Promise<LiveQuote | null> {
    if (!SUPPORTED_EXCHANGES.has(security.exchange)) return null

    const result = await ngnMarketGet<{ data: NgnMarketCompany[] }>(
      "/companies",
      { search: security.ticker, limit: "10" }
    )
    const match = result?.data.find((c) => c.symbol === security.ticker)
    if (!match) return null

    return {
      price: match.price,
      changePercent: match.price_change_percent,
      currency: security.currency,
      asOf: new Date(match.last_updated).toISOString(),
      source: "ngn_market",
    }
  },

  async getCompanyNews(
    security: SecurityRef,
    limit = 10
  ): Promise<LiveNewsItem[] | null> {
    if (!SUPPORTED_EXCHANGES.has(security.exchange)) return null

    type NgnMarketNewsItem = {
      title: string
      link: string
      source: string
      pub_date: string
    }

    // Starter plan or higher — returns null (PLAN_REQUIRED) on a free key,
    // and the router below falls back to mock news for this ticker.
    const result = await ngnMarketGet<{ data: NgnMarketNewsItem[] }>(
      `/companies/${security.ticker}/news`,
      { limit: String(limit) }
    )
    if (!result) return null

    return result.data.map((item) => ({
      headline: item.title,
      summary: null,
      url: item.link,
      source: item.source,
      publishedAt: new Date(item.pub_date).toISOString(),
    }))
  },
}
