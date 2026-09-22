import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { projectGoalTrajectory } from "@/lib/forecast"
import * as goalsRepo from "@/server/repositories/goals.repository"
import { createClient } from "@/server/supabase/server"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const goal = await goalsRepo.getGoal(user.id, id)
  if (!goal) return apiError("not_found", "Goal not found", 404)

  const trajectory = projectGoalTrajectory({
    currentAmount: Number(goal.currentAmount),
    targetAmount: Number(goal.targetAmount),
    targetDate: new Date(goal.targetDate),
    contributionAmount: Number(goal.contributionAmount),
    contributionFrequency: goal.contributionFrequency,
  })

  return apiSuccess(trajectory)
}
