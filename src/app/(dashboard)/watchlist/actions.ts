"use server"

import { revalidatePath } from "next/cache"

import { addToWatchlistSchema } from "@/lib/validation/watchlist"
import * as watchlistService from "@/server/services/watchlist.service"
import { createClient } from "@/server/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user
}

export async function addToWatchlistAction(securityId: string) {
  const user = await requireUser()
  const parsed = addToWatchlistSchema.parse({ securityId })
  const created = await watchlistService.addToWatchlist(
    user.id,
    parsed.securityId
  )
  revalidatePath("/watchlist")
  return created
}

export async function removeFromWatchlistAction(id: string) {
  const user = await requireUser()
  const removed = await watchlistService.removeFromWatchlist(user.id, id)
  revalidatePath("/watchlist")
  return removed
}
