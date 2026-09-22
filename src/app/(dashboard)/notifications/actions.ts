"use server"

import { revalidatePath } from "next/cache"

import * as notificationsService from "@/server/services/notifications.service"
import { createClient } from "@/server/supabase/server"

async function requireUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user.id
}

export async function markNotificationReadAction(id: string) {
  const userId = await requireUserId()
  const updated = await notificationsService.markRead(userId, id)
  revalidatePath("/", "layout")
  return updated
}

export async function markAllNotificationsReadAction() {
  const userId = await requireUserId()
  await notificationsService.markAllRead(userId)
  revalidatePath("/", "layout")
}
