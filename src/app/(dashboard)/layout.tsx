import { LogOut } from "lucide-react"
import { redirect } from "next/navigation"

import { MobileNav } from "@/components/layout/mobile-nav"
import { NotificationBell } from "@/components/layout/NotificationBell"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui/button"
import * as notificationsService from "@/server/services/notifications.service"
import { getCurrentUser } from "@/server/supabase/server"

import { logout } from "./actions"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Defense in depth: proxy.ts already redirects unauthenticated requests
  // away from this route group, but every protected layout/Server Function
  // verifies the user again itself rather than relying on the proxy alone.
  // getCurrentUser() is cached per-request (see supabase/server.ts), so this
  // and every page's own check below share one Supabase auth round trip
  // instead of each hitting the network separately.
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { notifications, unreadCount } = await notificationsService.listRecent(
    user.id
  )

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileNav userEmail={user.email ?? ""} logout={logout} />
      <aside className="hidden w-56 shrink-0 border-r md:flex md:flex-col">
        <div className="border-b px-4 py-4">
          <span className="text-brand text-lg font-semibold tracking-tight">
            Kovault Financial
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="border-t p-3">
          <div className="text-muted-foreground truncate px-1 pb-2 text-xs">
            {user.email}
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-1 px-6 pt-4">
          <ThemeToggle />
          <NotificationBell
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />
        </div>
        <div className="mx-auto max-w-6xl p-6 pt-2">{children}</div>
      </main>
    </div>
  )
}
