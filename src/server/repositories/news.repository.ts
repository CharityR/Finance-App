import { desc, eq, inArray, or } from "drizzle-orm"

import { db, schema } from "@/server/db"

export async function getNewsForSecuritiesAndSectors(
  securityIds: string[],
  sectors: string[],
  limit = 20
) {
  if (securityIds.length === 0 && sectors.length === 0) return []

  const conditions = []
  if (securityIds.length > 0) {
    conditions.push(inArray(schema.newsItems.securityId, securityIds))
  }
  if (sectors.length > 0) {
    conditions.push(inArray(schema.newsItems.sector, sectors))
  }

  return db.query.newsItems.findMany({
    where: or(...conditions),
    with: { security: true },
    orderBy: [desc(schema.newsItems.publishedAt)],
    limit,
  })
}

export async function getNewsForSecurity(
  securityId: string,
  sector: string | null
) {
  const conditions = [eq(schema.newsItems.securityId, securityId)]
  if (sector) conditions.push(eq(schema.newsItems.sector, sector))

  return db.query.newsItems.findMany({
    where: or(...conditions),
    orderBy: [desc(schema.newsItems.publishedAt)],
    limit: 10,
  })
}
