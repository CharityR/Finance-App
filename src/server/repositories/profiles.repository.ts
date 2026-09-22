import { eq } from "drizzle-orm"
import { cache } from "react"

import { db, schema } from "@/server/db"

/**
 * Cached per request: the root layout, the dashboard layout, and most
 * individual pages each read the profile once to render currency/theme, so
 * without this every page load ran the same query 2-4 times.
 */
export const getProfile = cache(async (userId: string) => {
  return db.query.profiles.findFirst({
    where: eq(schema.profiles.id, userId),
  })
})

export async function updateProfile(
  userId: string,
  data: Partial<{
    displayName: string
    baseCurrency: string
    themePalette: string
    timezone: string
    onboardingCompleted: boolean
  }>
) {
  const [updated] = await db
    .update(schema.profiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.profiles.id, userId))
    .returning()

  return updated
}
