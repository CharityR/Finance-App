import * as holdingsRepo from "@/server/repositories/holdings.repository"
import * as newsRepo from "@/server/repositories/news.repository"
import * as watchlistRepo from "@/server/repositories/watchlist.repository"
import { marketDataProvider } from "@/server/providers/market-data-provider"
import type { SecurityRef } from "@/server/providers/ports/market-data.port"

export type NewsItem = {
  id: string
  headline: string
  summary: string
  source: string
  publishedAt: string
  security: { ticker: string } | null
  sector: string | null
  /** "current" for a real live-fetched article, "estimated" for the seeded
   * mock fixtures — NewsFeed uses this instead of always showing a
   * "Sample data" badge, which would be wrong once live articles are
   * mixed in. */
  provenance: "current" | "estimated"
  /** Link to the original article — only ever set for live articles (mock
   * fixtures have no real source to link to). NewsFeed opens this in a new
   * tab instead of just showing a text block. */
  url: string | null
}

/** Live company news only exists (today) via Finnhub for non-NGX tickers —
 * NGN Market's free tier doesn't include the news endpoint (Starter+). One
 * security's worth of live articles, or [] if the live provider has
 * nothing for it (wrong market, plan restriction, API error). */
async function getLiveNewsForSecurity(
  security: SecurityRef & { id: string }
): Promise<NewsItem[]> {
  const items = await marketDataProvider.getCompanyNews(security, 5)
  if (!items) return []

  return items.map((item, i) => ({
    id: `live:${security.id}:${i}`,
    headline: item.headline,
    summary: item.summary ?? "",
    source: item.source,
    publishedAt: item.publishedAt,
    security: { ticker: security.ticker },
    sector: null,
    provenance: "current" as const,
    url: item.url,
  }))
}

function mapMockItem(item: {
  id: string
  headline: string
  summary: string
  source: string
  publishedAt: Date
  sector: string | null
  security?: { ticker: string } | null
}): NewsItem {
  return {
    id: item.id,
    headline: item.headline,
    summary: item.summary,
    source: item.source,
    publishedAt: item.publishedAt.toISOString(),
    security: item.security ? { ticker: item.security.ticker } : null,
    sector: item.sector,
    provenance: "estimated",
    url: null,
  }
}

/**
 * Relevance-filtered, not a firehose: only news tied to securities the user
 * actually holds or watches, or to a sector one of those securities belongs
 * to — matches the brief's "avoid a noisy feed" principle. Blends in real
 * live articles (Finnhub, non-NGX only, for now) for each held/watched
 * security ahead of the mock fixtures, rather than replacing them outright
 * — the mock set still fills in sector-relevance and NGX securities.
 */
export async function getRelevantNews(userId: string): Promise<NewsItem[]> {
  const [holdings, watchlist] = await Promise.all([
    holdingsRepo.listHoldings(userId),
    watchlistRepo.listWatchlist(userId),
  ])

  const securityMap = new Map<
    string,
    { id: string; ticker: string; exchange: string; currency: string }
  >()
  const sectors = new Set<string>()

  for (const h of holdings) {
    securityMap.set(h.securityId, {
      id: h.securityId,
      ticker: h.security.ticker,
      exchange: h.security.exchange,
      currency: h.security.currency,
    })
    if (h.security.sector) sectors.add(h.security.sector)
  }
  for (const w of watchlist) {
    securityMap.set(w.securityId, {
      id: w.securityId,
      ticker: w.security.ticker,
      exchange: w.security.exchange,
      currency: w.security.currency,
    })
    if (w.security.sector) sectors.add(w.security.sector)
  }

  const [mockItems, liveItemsBySecurity] = await Promise.all([
    newsRepo.getNewsForSecuritiesAndSectors(
      Array.from(securityMap.keys()),
      Array.from(sectors)
    ),
    Promise.all(Array.from(securityMap.values()).map(getLiveNewsForSecurity)),
  ])

  const items = [
    ...liveItemsBySecurity.flat(),
    ...mockItems.map((item) => mapMockItem(item)),
  ]

  return items
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, 20)
}

/** Same idea, scoped to one security — used by the company detail page. */
export async function getNewsForSecurity(security: {
  id: string
  ticker: string
  exchange: string
  currency: string
  sector: string | null
}): Promise<NewsItem[]> {
  const [liveItems, mockItems] = await Promise.all([
    getLiveNewsForSecurity(security),
    newsRepo.getNewsForSecurity(security.id, security.sector),
  ])

  if (liveItems.length > 0) return liveItems
  return mockItems.map((item) => mapMockItem({ ...item, security: null }))
}
