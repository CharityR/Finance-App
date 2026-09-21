import { LogOut } from "lucide-react"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { createClient } from "@/server/supabase/server"

import { logout } from "./actions"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Defense in depth: proxy.ts already redirects unauthenticated requests
  // away from this route group, but every protected layout/Server Function
  // verifies the user again itself rather than relying on the proxy alone.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r md:flex md:flex-col">
        <div className="border-b px-4 py-4">
          <span className="text-lg font-semibold tracking-tight">
            WealthPilot
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
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  )
}
