import { and, desc, eq } from "drizzle-orm"

import { db, schema } from "@/server/db"

export async function listManualAssets(userId: string) {
  return db.query.manualAssets.findMany({
    where: eq(schema.manualAssets.userId, userId),
    orderBy: [desc(schema.manualAssets.createdAt)],
  })
}

export async function listManualAssetsByCategory(
  userId: string,
  category: (typeof schema.manualAssetCategoryEnum.enumValues)[number]
) {
  return db.query.manualAssets.findMany({
    where: and(
      eq(schema.manualAssets.userId, userId),
      eq(schema.manualAssets.category, category)
    ),
    orderBy: [desc(schema.manualAssets.createdAt)],
  })
}

export async function getManualAsset(userId: string, id: string) {
  return db.query.manualAssets.findFirst({
    where: and(
      eq(schema.manualAssets.id, id),
      eq(schema.manualAssets.userId, userId)
    ),
  })
}

export async function createManualAsset(
  userId: string,
  data: {
    category: (typeof schema.manualAssetCategoryEnum.enumValues)[number]
    name: string
    country: string
    currency: string
    value: number
    notes?: string | null
  }
) {
  const [created] = await db
    .insert(schema.manualAssets)
    .values({
      userId,
      category: data.category,
      name: data.name,
      country: data.country,
      currency: data.currency,
      value: data.value.toString(),
      notes: data.notes ?? null,
    })
    .returning()

  return created
}

export async function updateManualAsset(
  userId: string,
  id: string,
  data: Partial<{
    category: (typeof schema.manualAssetCategoryEnum.enumValues)[number]
    name: string
    country: string
    currency: string
    value: number
    notes: string | null
  }>
) {
  const [updated] = await db
    .update(schema.manualAssets)
    .set({
      ...data,
      value: data.value?.toString(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.manualAssets.id, id),
        eq(schema.manualAssets.userId, userId)
      )
    )
    .returning()

  return updated
}

export async function deleteManualAsset(userId: string, id: string) {
  const [deleted] = await db
    .delete(schema.manualAssets)
    .where(
      and(
        eq(schema.manualAssets.id, id),
        eq(schema.manualAssets.userId, userId)
      )
    )
    .returning()

  return deleted
}
