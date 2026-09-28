"use server"

import * as dashboardService from "@/server/services/dashboard.service"
import { getProfile } from "@/server/repositories/profiles.repository"
import { getCurrentUser } from "@/server/supabase/server"

async function requireUserAndCurrency() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  const profile = await getProfile(user.id)
  return { userId: user.id, currency: profile?.baseCurrency ?? "NGN" }
}

/**
 * One action per dashboard section (see dashboard.service.ts) — called
 * independently by each section's client component so a slow/failed
 * section never blocks the others, and a user-triggered Retry only
 * re-invokes the one action that failed, not the whole page.
 */
export async function fetchNetWorthSectionAction() {
  const { userId, currency } = await requireUserAndCurrency()
  return dashboardService.getNetWorthSection(userId, currency)
}

export async function fetchGoalsAndBudgetSectionAction() {
  const { userId, currency } = await requireUserAndCurrency()
  return dashboardService.getGoalsAndBudgetSection(userId, currency)
}

export async function fetchCashFlowSectionAction() {
  const { userId, currency } = await requireUserAndCurrency()
  return dashboardService.getCashFlowSection(userId, currency)
}
