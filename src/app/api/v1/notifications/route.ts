import { apiError, apiSuccess } from "@/lib/api-response"
import * as notificationsService from "@/server/services/notifications.service"
import { createClient } from "@/server/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const result = await notificationsService.listRecent(user.id)
  return apiSuccess(result)
}
