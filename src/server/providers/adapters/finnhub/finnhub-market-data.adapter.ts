import { serverEnv } from "@/lib/env.server"
import type {
  LiveNewsItem,
  LiveQuote,
  MarketDataProvider,
  SecurityRef,
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
}
