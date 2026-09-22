"use server"

import { revalidatePath } from "next/cache"

import { getProfile } from "@/server/repositories/profiles.repository"
import * as budgetsService from "@/server/services/budgets.service"
import { createClient } from "@/server/supabase/server"

export async function saveBudgetAction(
  limits: { categoryId: string; limitAmount: number }[]
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const profile = await getProfile(user.id)
  const result = await budgetsService.saveBudgetForMonth(
    user.id,
    new Date(),
    profile?.baseCurrency ?? "NGN",
    limits
  )
  revalidatePath("/budgets")
  revalidatePath("/dashboard")
  return result
}
