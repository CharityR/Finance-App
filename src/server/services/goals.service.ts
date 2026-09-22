import { emitEvent } from "@/server/events/emit"
import * as repo from "@/server/repositories/goals.repository"
import type { CreateGoalInput, UpdateGoalInput } from "@/lib/validation/goals"

export type GoalProgress = {
  percentage: number
  amountRemaining: number
  requiredMonthlyContribution: number
  projectedCompletionDate: string | null
  isOnTrack: boolean
  monthsRemaining: number
}

/**
 * Linear progress model: required contribution assumes the remaining amount
 * spread evenly over the months left; projected completion extrapolates
 * from the goal's own logged contribution history (not the target), so
 * "on track" reflects what the user has actually been doing, not what they
 * hoped to do.
 */
export function computeGoalProgress(goal: {
  currentAmount: string
  targetAmount: string
  targetDate: string
  createdAt: Date
  contributions: { amount: string; occurredAt: Date }[]
}): GoalProgress {
  const current = Number(goal.currentAmount)
  const target = Number(goal.targetAmount)
  const now = new Date()
  const targetDate = new Date(goal.targetDate)

  const percentage = target > 0 ? (current / target) * 100 : 0
  const amountRemaining = target - current

  const msPerMonth = 1000 * 60 * 60 * 24 * 30.44
  const monthsRemaining = Math.max(
    (targetDate.getTime() - now.getTime()) / msPerMonth,
    0
  )
  const requiredMonthlyContribution =
    monthsRemaining > 0 ? amountRemaining / monthsRemaining : amountRemaining

  const totalContributed = goal.contributions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  )
  const monthsSinceCreation = Math.max(
    (now.getTime() - goal.createdAt.getTime()) / msPerMonth,
    1 / 30.44 // at least one day, avoids divide-by-zero on a same-day goal
  )
  const averageMonthlyContribution = totalContributed / monthsSinceCreation

  let projectedCompletionDate: string | null = null
  let isOnTrack = amountRemaining <= 0

  if (amountRemaining > 0 && averageMonthlyContribution > 0) {
    const monthsToComplete = amountRemaining / averageMonthlyContribution
    const projected = new Date(now)
    projected.setDate(1)
    projected.setMonth(projected.getMonth() + Math.ceil(monthsToComplete))
    projectedCompletionDate = projected.toISOString().slice(0, 10)
    isOnTrack = projected.getTime() <= targetDate.getTime()
  }

  return {
    percentage,
    amountRemaining,
    requiredMonthlyContribution,
    projectedCompletionDate,
    isOnTrack,
    monthsRemaining,
  }
}

export async function listGoalsWithProgress(userId: string) {
  const goals = await repo.listGoals(userId)
  return Promise.all(
    goals.map(async (goal) => {
      const full = await repo.getGoal(userId, goal.id)
      return {
        ...goal,
        progress: computeGoalProgress({
          ...goal,
          contributions: full?.contributions ?? [],
        }),
      }
    })
  )
}

export async function getGoalWithProgress(userId: string, id: string) {
  const goal = await repo.getGoal(userId, id)
  if (!goal) return null
  return { ...goal, progress: computeGoalProgress(goal) }
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  return repo.createGoal(userId, input)
}

export async function updateGoal(
  userId: string,
  id: string,
  input: UpdateGoalInput
) {
  return repo.updateGoal(userId, id, input)
}

export async function archiveGoal(userId: string, id: string) {
  return repo.archiveGoal(userId, id)
}

export async function logContribution(
  userId: string,
  goalId: string,
  amount: number,
  occurredAt: Date
) {
  const contribution = await repo.logContribution(
    userId,
    goalId,
    amount,
    occurredAt
  )

  const goal = await repo.getGoal(userId, goalId)
  if (goal) {
    await emitEvent("goal.contribution_logged", {
      userId,
      entityId: goalId,
      goalName: goal.name,
      amount,
      currency: goal.currency,
    })

    const progress = computeGoalProgress(goal)
    if (!progress.isOnTrack) {
      await emitEvent("goal.off_track", {
        userId,
        entityId: goalId,
        goalName: goal.name,
      })
    }
  }

  return contribution
}
