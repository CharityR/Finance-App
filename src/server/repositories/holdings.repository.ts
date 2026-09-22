import { and, eq } from "drizzle-orm"

import { db, schema } from "@/server/db"

export async function listHoldings(userId: string) {
  return db.query.holdings.findMany({
    where: eq(schema.holdings.userId, userId),
    with: { security: true },
    orderBy: (h, { asc }) => [asc(h.createdAt)],
  })
}

export async function getHolding(userId: string, id: string) {
  return db.query.holdings.findFirst({
    where: and(eq(schema.holdings.id, id), eq(schema.holdings.userId, userId)),
    with: { security: true },
  })
}

/**
 * Adds to a position. Since a user can only have one holdings row per
 * security (enforced by a unique index), a second purchase of the same
 * security merges into the existing row with a recomputed weighted-average
 * cost basis rather than creating a duplicate.
 */
export async function addOrMergeHolding(
  userId: string,
  securityId: string,
  quantity: number,
  purchasePrice: number,
  currency: string
) {
  const existing = await db.query.holdings.findFirst({
    where: and(
      eq(schema.holdings.userId, userId),
      eq(schema.holdings.securityId, securityId)
    ),
  })

  if (!existing) {
    const [created] = await db
      .insert(schema.holdings)
      .values({
        userId,
        securityId,
        quantity: quantity.toString(),
        averageCostBasis: purchasePrice.toString(),
        currency,
      })
      .returning()
    return created
  }

  const existingQuantity = Number(existing.quantity)
  const existingCostBasis = Number(existing.averageCostBasis)
  const newQuantity = existingQuantity + quantity
  const newCostBasis =
    (existingQuantity * existingCostBasis + quantity * purchasePrice) /
    newQuantity

  const [updated] = await db
    .update(schema.holdings)
    .set({
      quantity: newQuantity.toString(),
      averageCostBasis: newCostBasis.toString(),
      updatedAt: new Date(),
    })
    .where(eq(schema.holdings.id, existing.id))
    .returning()
  return updated
}

export async function updateHolding(
  userId: string,
  id: string,
  data: Partial<{ quantity: number; averageCostBasis: number }>
) {
  const [updated] = await db
    .update(schema.holdings)
    .set({
      quantity: data.quantity?.toString(),
      averageCostBasis: data.averageCostBasis?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.holdings.id, id), eq(schema.holdings.userId, userId)))
    .returning()
  return updated
}

export async function removeHolding(userId: string, id: string) {
  const [deleted] = await db
    .delete(schema.holdings)
    .where(and(eq(schema.holdings.id, id), eq(schema.holdings.userId, userId)))
    .returning()
  return deleted
}
