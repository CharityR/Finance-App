import { apiError, apiSuccess } from "@/lib/api-response"
import * as notificationsService from "@/server/services/notifications.service"
import { createClient } from "@/server/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  await notificationsService.markAllRead(user.id)
  return apiSuccess({ ok: true })
}
