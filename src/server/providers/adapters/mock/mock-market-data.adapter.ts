import { desc, eq } from "drizzle-orm"

import { db, schema } from "@/server/db"
import type {
  LiveNewsItem,
  LiveQuote,
  MarketDataProvider,
  ResolvedSecurity,
  SecurityRef,
  SymbolSearchResult,
} from "@/server/providers/ports/market-data.port"

/**
 * Reads the same seeded price_snapshot/news_item tables every other part of
 * the app has always used — this is PROVIDER_MODE=mock's implementation,
 * and also the fallback every live adapter's router falls back to when a
 * real provider can't serve a request. Behavior is byte-for-byte what the
 * app did before this abstraction existed.
 */
export const mockMarketDataAdapter: MarketDataProvider = {
  async getQuote(security: SecurityRef): Promise<LiveQuote | null> {
    const row = await db.query.securities.findFirst({
      where: eq(schema.securities.ticker, security.ticker),
    })
    if (!row) return null

    const snapshots = await db.query.priceSnapshots.findMany({
      where: eq(schema.priceSnapshots.securityId, row.id),
      orderBy: [desc(schema.priceSnapshots.fetchedAt)],
      limit: 2,
    })
    const [latest, previous] = snapshots
    if (!latest) return null

    const price = Number(latest.price)
    const changePercent =
      previous && Number(previous.price) > 0
        ? ((price - Number(previous.price)) / Number(previous.price)) * 100
        : null

    return {
      price,
      changePercent,
      currency: security.currency,
      asOf: latest.fetchedAt.toISOString(),
      source: "mock",
    }
  },

  async getCompanyNews(
    security: SecurityRef,
    limit = 10
  ): Promise<LiveNewsItem[] | null> {
    const row = await db.query.securities.findFirst({
      where: eq(schema.securities.ticker, security.ticker),
    })
    if (!row) return null

    const items = await db.query.newsItems.findMany({
      where: eq(schema.newsItems.securityId, row.id),
      orderBy: (n, { desc }) => [desc(n.publishedAt)],
      limit,
    })

    return items.map((item) => ({
      headline: item.headline,
      summary: item.summary,
      url: "#",
      source: item.source,
      publishedAt: item.publishedAt.toISOString(),
    }))
  },

  // The mock adapter has no "universe" beyond the seeded rows a plain DB
  // search already covers (securities.service.ts checks the DB itself) —
  // nothing new for it to search or resolve.
  async searchSymbols(): Promise<SymbolSearchResult[] | null> {
    return null
  },

  async resolveSecurity(): Promise<ResolvedSecurity | null> {
    return null
  },
}
