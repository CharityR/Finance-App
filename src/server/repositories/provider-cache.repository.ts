import { and, desc, eq, gte } from "drizzle-orm"

import { db, schema } from "@/server/db"

/**
 * Generic TTL cache backed by provider_cache (stubbed in Phase 0 for
 * exactly this). Live market-data calls go through this before hitting a
 * real provider — essential given how tight the free tiers are (NGN
 * Market: 3,000 calls/month, 30/min; Finnhub: 60/min).
 */
export async function getCached<T>(
  provider: string,
  dataType: string,
  externalId: string,
  maxAgeMs: number
): Promise<T | null> {
  const cutoff = new Date(Date.now() - maxAgeMs)

  const row = await db.query.providerCache.findFirst({
    where: and(
      eq(schema.providerCache.provider, provider),
      eq(schema.providerCache.dataType, dataType),
      eq(schema.providerCache.externalId, externalId),
      gte(schema.providerCache.fetchedAt, cutoff)
    ),
    orderBy: [desc(schema.providerCache.fetchedAt)],
  })

  return row ? (row.payload as T) : null
}

export async function setCached(
  provider: string,
  dataType: string,
  externalId: string,
  payload: unknown,
  provenance: (typeof schema.provenanceEnum.enumValues)[number]
) {
  await db.insert(schema.providerCache).values({
    provider,
    dataType,
    externalId,
    payload: payload as object,
    provenance,
  })
}
