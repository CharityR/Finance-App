import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import { updateGoalSchema } from "@/lib/validation/goals"
import * as goalsService from "@/server/services/goals.service"
import { createClient } from "@/server/supabase/server"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const goal = await goalsService.getGoalWithProgress(user.id, id)
  if (!goal) return apiError("not_found", "Goal not found", 404)

  return apiSuccess(goal)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const body = await request.json()
  const parsed = updateGoalSchema.safeParse(body)
  if (!parsed.success)
    return apiError("invalid_body", parsed.error.message, 400)

  const updated = await goalsService.updateGoal(user.id, id, parsed.data)
  if (!updated) return apiError("not_found", "Goal not found", 404)

  return apiSuccess(updated)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const archived = await goalsService.archiveGoal(user.id, id)
  if (!archived) return apiError("not_found", "Goal not found", 404)

  return apiSuccess({ id: archived.id })
}
