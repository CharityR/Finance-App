import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { createGoalSchema } from "@/lib/validation/goals"
import * as goalsService from "@/server/services/goals.service"
import { createClient } from "@/server/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const goals = await goalsService.listGoalsWithProgress(user.id)
  return apiSuccess(goals)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const body = await request.json()
  const parsed = createGoalSchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const created = await goalsService.createGoal(user.id, parsed.data)
  return apiSuccess(created, { status: 201 })
}
