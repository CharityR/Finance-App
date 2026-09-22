import * as repo from "@/server/repositories/notifications.repository"

export async function listRecent(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    repo.listNotifications(userId),
    repo.countUnread(userId),
  ])
  return { notifications, unreadCount }
}

export async function markRead(userId: string, id: string) {
  return repo.markRead(userId, id)
}

export async function markAllRead(userId: string) {
  return repo.markAllRead(userId)
}

export async function getPreferences(userId: string) {
  return repo.getPreferences(userId)
}

export async function updatePreferences(
  userId: string,
  data: Partial<typeof repo.DEFAULT_PREFERENCES>
) {
  return repo.upsertPreferences(userId, data)
}
