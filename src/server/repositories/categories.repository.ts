import { eq, isNull, or } from "drizzle-orm"

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
