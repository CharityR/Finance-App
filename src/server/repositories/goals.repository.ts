import { and, desc, eq } from "drizzle-orm"

import { db, schema } from "@/server/db"

export async function listGoals(userId: string, includeArchived = false) {
  return db.query.goals.findMany({
    where: includeArchived
      ? eq(schema.goals.userId, userId)
      : and(eq(schema.goals.userId, userId), eq(schema.goals.status, "active")),
    orderBy: [desc(schema.goals.createdAt)],
  })
}

export async function getGoal(userId: string, id: string) {
  return db.query.goals.findFirst({
    where: and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)),
    with: {
      contributions: { orderBy: (c, { desc }) => [desc(c.occurredAt)] },
    },
  })
}

export async function createGoal(
  userId: string,
  data: {
    name: string
    category: (typeof schema.goalCategoryEnum.enumValues)[number]
    targetAmount: number
    targetDate: Date
    priority: (typeof schema.goalPriorityEnum.enumValues)[number]
    contributionFrequency: (typeof schema.contributionFrequencyEnum.enumValues)[number]
    contributionAmount: number
    currency: string
  }
) {
  const [created] = await db
    .insert(schema.goals)
    .values({
      userId,
      name: data.name,
      category: data.category,
      targetAmount: data.targetAmount.toString(),
      targetDate: data.targetDate.toISOString().slice(0, 10),
      priority: data.priority,
      contributionFrequency: data.contributionFrequency,
      contributionAmount: data.contributionAmount.toString(),
      currency: data.currency,
    })
    .returning()

  return created
}

export async function updateGoal(
  userId: string,
  id: string,
  data: Partial<{
    name: string
    category: (typeof schema.goalCategoryEnum.enumValues)[number]
    targetAmount: number
    targetDate: Date
    priority: (typeof schema.goalPriorityEnum.enumValues)[number]
    contributionFrequency: (typeof schema.contributionFrequencyEnum.enumValues)[number]
    contributionAmount: number
    currency: string
  }>
) {
  const [updated] = await db
    .update(schema.goals)
    .set({
      ...data,
      targetAmount: data.targetAmount?.toString(),
      contributionAmount: data.contributionAmount?.toString(),
      targetDate: data.targetDate?.toISOString().slice(0, 10),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)))
    .returning()

  return updated
}

export async function archiveGoal(userId: string, id: string) {
  const [updated] = await db
    .update(schema.goals)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)))
    .returning()

  return updated
}

/**
 * Logs a contribution and bumps the goal's current_amount in one
 * transaction, so the two never drift out of sync.
 */
export async function logContribution(
  userId: string,
  goalId: string,
  amount: number,
  occurredAt: Date
) {
  return db.transaction(async (tx) => {
    const goal = await tx.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.userId, userId)),
    })
    if (!goal) return null

    const [contribution] = await tx
      .insert(schema.goalContributions)
      .values({ goalId, amount: amount.toString(), occurredAt })
      .returning()

    const newAmount = Number(goal.currentAmount) + amount
    const isNowComplete = newAmount >= Number(goal.targetAmount)

    const [updatedGoal] = await tx
      .update(schema.goals)
      .set({
        currentAmount: newAmount.toString(),
        status: isNowComplete ? "completed" : goal.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.goals.id, goalId))
      .returning()

    return { contribution, goal: updatedGoal }
  })
}
