import { and, eq, isNull, or } from "drizzle-orm"

import { db, schema } from "@/server/db"

/** System categories (shared, `userId` null) plus the user's own custom ones. */
export async function listCategoriesForUser(userId: string) {
  return db.query.categories.findMany({
    where: or(
      isNull(schema.categories.userId),
      eq(schema.categories.userId, userId)
    ),
    orderBy: (categories, { asc }) => [
      asc(categories.type),
      asc(categories.name),
    ],
  })
}

export async function getCategoryById(id: string) {
  return db.query.categories.findFirst({
    where: eq(schema.categories.id, id),
  })
}

export async function createCategory(
  userId: string,
  data: { name: string; type: "income" | "expense"; color: string }
) {
  const [created] = await db
    .insert(schema.categories)
    .values({ userId, name: data.name, type: data.type, color: data.color })
    .returning()

  return created
}

/** Scoped to `userId` and `isSystem = false` so a user can never edit
 * another user's category or a shared system one. */
export async function updateCategory(
  userId: string,
  id: string,
  data: Partial<{ name: string; color: string }>
) {
  const [updated] = await db
    .update(schema.categories)
    .set(data)
    .where(
      and(
        eq(schema.categories.id, id),
        eq(schema.categories.userId, userId),
        eq(schema.categories.isSystem, false)
      )
    )
    .returning()

  return updated
}

export async function deleteCategory(userId: string, id: string) {
  const [deleted] = await db
    .delete(schema.categories)
    .where(
      and(
        eq(schema.categories.id, id),
        eq(schema.categories.userId, userId),
        eq(schema.categories.isSystem, false)
      )
    )
    .returning()

  return deleted
}
