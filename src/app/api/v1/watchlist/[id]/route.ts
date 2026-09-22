import type { NextRequest } from "next/server"

import { apiError, apiSuccess } from "@/lib/api-response"
import * as watchlistService from "@/server/services/watchlist.service"
import { createClient } from "@/server/supabase/server"

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return apiError("unauthorized", "Not authenticated", 401)

  const { id } = await params
  const deleted = await watchlistService.removeFromWatchlist(user.id, id)
  if (!deleted) return apiError("not_found", "Watchlist item not found", 404)

  return apiSuccess({ id: deleted.id })
}
