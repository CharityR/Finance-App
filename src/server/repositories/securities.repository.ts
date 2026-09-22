import { desc, eq, ilike, or } from "drizzle-orm"

import { db, schema } from "@/server/db"

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

export async function getLatestPrice(securityId: string) {
  return db.query.priceSnapshots.findFirst({
    where: eq(schema.priceSnapshots.securityId, securityId),
    orderBy: [desc(schema.priceSnapshots.fetchedAt)],
  })
}

/** Latest price per security, in one query rather than N. */
export async function getLatestPrices(securityIds: string[]) {
  if (securityIds.length === 0) return new Map()

  const rows = await db.query.priceSnapshots.findMany({
    where: (p, { inArray }) => inArray(p.securityId, securityIds),
    orderBy: [desc(schema.priceSnapshots.fetchedAt)],
  })

  const latestBySecurity = new Map<string, (typeof rows)[number]>()
  for (const row of rows) {
    if (!latestBySecurity.has(row.securityId)) {
      latestBySecurity.set(row.securityId, row)
    }
  }
  return latestBySecurity
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
