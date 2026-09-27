import { and, desc, eq } from "drizzle-orm"

import { db, schema } from "@/server/db"

export async function listLiabilities(userId: string) {
  return db.query.liabilities.findMany({
    where: eq(schema.liabilities.userId, userId),
    orderBy: [desc(schema.liabilities.createdAt)],
  })
}

export async function getLiability(userId: string, id: string) {
  return db.query.liabilities.findFirst({
    where: and(
      eq(schema.liabilities.id, id),
      eq(schema.liabilities.userId, userId)
    ),
  })
}

export async function createLiability(
  userId: string,
  data: {
    category: (typeof schema.liabilityCategoryEnum.enumValues)[number]
    name: string
    currency: string
    balance: number
    notes?: string | null
  }
) {
  const [created] = await db
    .insert(schema.liabilities)
    .values({
      userId,
      category: data.category,
      name: data.name,
      currency: data.currency,
      balance: data.balance.toString(),
      notes: data.notes ?? null,
    })
    .returning()

  return created
}

export async function updateLiability(
  userId: string,
  id: string,
  data: Partial<{
    category: (typeof schema.liabilityCategoryEnum.enumValues)[number]
    name: string
    currency: string
    balance: number
    notes: string | null
  }>
) {
  const [updated] = await db
    .update(schema.liabilities)
    .set({
      ...data,
      balance: data.balance?.toString(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.liabilities.id, id),
        eq(schema.liabilities.userId, userId)
      )
    )
    .returning()

  return updated
}

export async function deleteLiability(userId: string, id: string) {
  const [deleted] = await db
    .delete(schema.liabilities)
    .where(
      and(
        eq(schema.liabilities.id, id),
        eq(schema.liabilities.userId, userId)
      )
    )
    .returning()

  return deleted
}
