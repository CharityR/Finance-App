import { desc, eq, ilike, or } from "drizzle-orm"

import { db, schema } from "@/server/db"
import { marketDataProvider } from "@/server/providers/market-data-provider"

export async function searchSecurities(query: string) {
  if (!query.trim()) {
    return db.query.securities.findMany({
      orderBy: (s, { asc }) => [asc(s.ticker)],
      limit: 20,
    })
  }
  return db.query.securities.findMany({
    where: or(
      ilike(schema.securities.ticker, `%${query}%`),
      ilike(schema.securities.name, `%${query}%`)
    ),
    orderBy: (s, { asc }) => [asc(s.ticker)],
    limit: 20,
  })
}

export async function getSecurity(id: string) {
  return db.query.securities.findFirst({
    where: eq(schema.securities.id, id),
  })
}

export async function getSecurityByTicker(ticker: string) {
  return db.query.securities.findFirst({
    where: eq(schema.securities.ticker, ticker.toUpperCase()),
  })
}

/**
 * Get-or-create by (ticker, exchange) — the same unique index that already
 * prevents seed-data duplicates. Used when a user picks a live search
 * result (e.g. Tesla) that isn't one of the pre-seeded fixtures yet;
 * isMock: false marks it as a real, provider-resolved security rather than
 * fixture data, so it doesn't get the "Mock data" badge on its detail page.
 */
export async function upsertSecurity(details: {
  ticker: string
  name: string
  exchange: string
  currency: string
  country: string
  sector: string | null
  assetClass: (typeof schema.assetClassEnum.enumValues)[number]
}) {
  const [row] = await db
    .insert(schema.securities)
    .values({ ...details, isMock: false })
    .onConflictDoUpdate({
      target: [schema.securities.ticker, schema.securities.exchange],
      set: {
        name: details.name,
        sector: details.sector,
        country: details.country,
        currency: details.currency,
      },
    })
    .returning()

  return row
}

export async function getLatestPrice(securityId: string) {
  return db.query.priceSnapshots.findFirst({
    where: eq(schema.priceSnapshots.securityId, securityId),
    orderBy: [desc(schema.priceSnapshots.fetchedAt)],
  })
}

export type LatestPriceInfo = {
  price: number
  changePercent: number | null
  fetchedAt: Date
  provenance: "current" | "estimated"
}

/**
 * Latest price per security. Goes through marketDataProvider (live Finnhub/
 * NGN Market quotes when PROVIDER_MODE=live, falling back to the seeded
 * price_snapshot table otherwise) — this repository is the only place that
 * knows a live provider exists; holdings.service.ts and watchlist.service.ts
 * just get a price back, unaware of where it came from.
 */
export async function getLatestPrices(
  securities: {
    id: string
    ticker: string
    exchange: string
    currency: string
  }[]
): Promise<Map<string, LatestPriceInfo>> {
  if (securities.length === 0) return new Map()

  const results = await Promise.all(
    securities.map(async (security) => {
      const quote = await marketDataProvider.getQuote(security)
      if (!quote) return null
      return [
        security.id,
        {
          price: quote.price,
          changePercent: quote.changePercent,
          fetchedAt: new Date(quote.asOf),
          provenance: quote.source === "mock" ? "estimated" : "current",
        } satisfies LatestPriceInfo,
      ] as const
    })
  )

  return new Map(results.filter((r): r is NonNullable<typeof r> => r !== null))
}

export async function getPriceHistory(securityId: string, limit = 30) {
  return db.query.priceSnapshots.findMany({
    where: eq(schema.priceSnapshots.securityId, securityId),
    orderBy: [desc(schema.priceSnapshots.fetchedAt)],
    limit,
  })
}

export async function getDividendHistory(securityId: string) {
  return db.query.dividendEvents.findMany({
    where: eq(schema.dividendEvents.securityId, securityId),
    orderBy: (d, { desc }) => [desc(d.exDate)],
  })
}
