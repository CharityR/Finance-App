import { NextResponse } from "next/server"

import { getProfile } from "@/server/repositories/profiles.repository"
import * as dashboardService from "@/server/services/dashboard.service"
import * as notificationsService from "@/server/services/notifications.service"
import { getCurrentUser } from "@/server/supabase/server"

/**
 * TEMPORARY diagnostic route — times each step of a typical dashboard
 * request server-side to find the real bottleneck, instead of guessing.
 * Delete this file once the investigation is done.
 */
export async function GET() {
  const marks: Record<string, number> = {}
  const t0 = performance.now()

  const user = await getCurrentUser()
  marks.getCurrentUser = performance.now() - t0

  if (!user) {
    return NextResponse.json({ error: "not authenticated", marks })
  }

  const t1 = performance.now()
  const profile = await getProfile(user.id)
  marks.getProfile = performance.now() - t1

  const t2 = performance.now()
  const notifs = await notificationsService.listRecent(user.id)
  marks.notificationsListRecent = performance.now() - t2

  const t3 = performance.now()
  const summary = await dashboardService.getDashboardSummary(
    user.id,
    profile?.baseCurrency ?? "NGN"
  )
  marks.dashboardSummary = performance.now() - t3

  marks.total = performance.now() - t0

  return NextResponse.json({
    marks,
    notifCount: notifs.notifications.length,
    hasBudget: summary.hasBudget,
  })
}
