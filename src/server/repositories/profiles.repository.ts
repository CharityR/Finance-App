import { eq } from "drizzle-orm"

import { db, schema } from "@/server/db"

export async function getProfile(userId: string) {
  return db.query.profiles.findFirst({
    where: eq(schema.profiles.id, userId),
  })
}

export async function updateProfile(
  userId: string,
  data: Partial<{
    displayName: string
    baseCurrency: string
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
