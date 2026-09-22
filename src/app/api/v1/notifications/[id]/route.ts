import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import * as notificationsService from "@/server/services/notifications.service"
import { createClient } from "@/server/supabase/server"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const updated = await notificationsService.markRead(user.id, id)
  if (!updated) return apiError("not_found", "Notification not found", 404)

  return apiSuccess(updated)
}
