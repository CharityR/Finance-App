"use server"

import { revalidatePath } from "next/cache"

import {
  createGoalSchema,
  logContributionSchema,
  updateGoalSchema,
  type CreateGoalInput,
  type LogContributionInput,
  type UpdateGoalInput,
} from "@/lib/validation/goals"
import * as goalsService from "@/server/services/goals.service"
import { createClient } from "@/server/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user
}

export async function createGoalAction(input: CreateGoalInput) {
  const user = await requireUser()
  const parsed = createGoalSchema.parse(input)
  const created = await goalsService.createGoal(user.id, parsed)
  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return created
}

export async function updateGoalAction(id: string, input: UpdateGoalInput) {
  const user = await requireUser()
  const parsed = updateGoalSchema.parse(input)
  const updated = await goalsService.updateGoal(user.id, id, parsed)
  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return updated
}

export async function archiveGoalAction(id: string) {
  const user = await requireUser()
  const archived = await goalsService.archiveGoal(user.id, id)
  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return archived
}

export async function logContributionAction(
  goalId: string,
  input: LogContributionInput
) {
  const user = await requireUser()
  const parsed = logContributionSchema.parse(input)
  const result = await goalsService.logContribution(
    user.id,
    goalId,
    parsed.amount,
    parsed.occurredAt
  )
  revalidatePath("/goals")
  revalidatePath("/dashboard")
  return result
}
