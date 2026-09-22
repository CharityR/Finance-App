"use client"

import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(dashboard)/notifications/actions"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatRelativeTime } from "@/lib/date"
import { cn } from "@/lib/utils"

export type NotificationItem = {
  id: string
  title: string
  body: string
  readAt: Date | string | null
  createdAt: Date | string
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationItem[]
  initialUnreadCount: number
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  async function handleMarkRead(id: string) {
    const target = notifications.find((n) => n.id === id)
    if (!target || target.readAt) return

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    )
    setUnreadCount((prev) => Math.max(prev - 1, 0))
    await markNotificationReadAction(id)
    router.refresh()
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })))
    setUnreadCount(0)
    await markAllNotificationsReadAction()
    router.refresh()
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="relative">
            <span className="sr-only">Notifications</span>
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="bg-destructive absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs"
            disabled={unreadCount === 0}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground p-4 text-center text-sm">
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleMarkRead(n.id)}
                className={cn(
                  "hover:bg-muted/50 flex w-full flex-col gap-0.5 border-b p-3 text-left last:border-b-0",
                  !n.readAt && "bg-primary/5"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {!n.readAt && (
                    <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                  )}
                  <span className="text-sm font-medium">{n.title}</span>
                </div>
                <p className="text-muted-foreground text-xs">{n.body}</p>
                <p className="text-muted-foreground text-[11px]">
                  {formatRelativeTime(n.createdAt)}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
