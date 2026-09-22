import { and, eq } from "drizzle-orm"

import { db, schema } from "@/server/db"

export async function listWatchlist(userId: string) {
  return db.query.watchlistItems.findMany({
    where: eq(schema.watchlistItems.userId, userId),
    with: { security: true },
    orderBy: (w, { desc }) => [desc(w.addedAt)],
  })
}

export async function addToWatchlist(userId: string, securityId: string) {
  const existing = await db.query.watchlistItems.findFirst({
    where: and(
      eq(schema.watchlistItems.userId, userId),
      eq(schema.watchlistItems.securityId, securityId)
    ),
  })
  if (existing) return existing

  const [created] = await db
    .insert(schema.watchlistItems)
    .values({ userId, securityId })
    .returning()
  return created
}

export async function removeFromWatchlist(userId: string, id: string) {
  const [deleted] = await db
    .delete(schema.watchlistItems)
    .where(
      and(
        eq(schema.watchlistItems.id, id),
        eq(schema.watchlistItems.userId, userId)
      )
    )
    .returning()
  return deleted
}
