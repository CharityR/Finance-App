import { and, eq, isNull, sql } from "drizzle-orm"

import { db, schema } from "@/server/db"

export type NotificationType =
  | "budget_exceeded"
  | "goal_off_track"
  | "goal_contribution_logged"
  | "category_spending_trend"
  | "unusual_transaction"

export type NotificationPreferenceFlags = {
  budgetExceeded: boolean
  goalOffTrack: boolean
  goalContributionLogged: boolean
  categorySpendingTrend: boolean
  unusualTransaction: boolean
}

export const DEFAULT_PREFERENCES: NotificationPreferenceFlags = {
  budgetExceeded: true,
  goalOffTrack: true,
  goalContributionLogged: false,
  categorySpendingTrend: true,
  unusualTransaction: true,
}

export async function getPreferences(userId: string) {
  const row = await db.query.notificationPreferences.findFirst({
    where: eq(schema.notificationPreferences.userId, userId),
  })
  return row ?? { userId, ...DEFAULT_PREFERENCES }
}

export async function upsertPreferences(
  userId: string,
  data: Partial<typeof DEFAULT_PREFERENCES>
) {
  const [row] = await db
    .insert(schema.notificationPreferences)
    .values({ userId, ...DEFAULT_PREFERENCES, ...data })
    .onConflictDoUpdate({
      target: schema.notificationPreferences.userId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning()

  return row
}

export async function createNotification(data: {
  userId: string
  type: NotificationType
  entityId?: string
  title: string
  body: string
}) {
  const [row] = await db.insert(schema.notifications).values(data).returning()
  return row
}

export async function listNotifications(userId: string, limit = 20) {
  return db.query.notifications.findMany({
    where: eq(schema.notifications.userId, userId),
    orderBy: (n, { desc }) => [desc(n.createdAt)],
    limit,
  })
}

export async function countUnread(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt)
      )
    )
  return row?.count ?? 0
}

export async function markRead(userId: string, id: string) {
  const [row] = await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.userId, userId)
      )
    )
    .returning()
  return row
}

export async function markAllRead(userId: string) {
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt)
      )
    )
}
