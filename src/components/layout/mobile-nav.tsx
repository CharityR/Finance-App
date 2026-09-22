"use client"

import { LogOut, Menu } from "lucide-react"
import { useState } from "react"

import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MobileNav({
  userEmail,
  logout,
}: {
  userEmail: string
  logout: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-between border-b px-4 py-3 md:hidden">
      <span className="text-brand text-lg font-semibold tracking-tight">
        Kovault Financial
      </span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <span className="sr-only">Open menu</span>
              <Menu />
            </Button>
          }
        />
        <SheetContent side="left" className="flex w-64 flex-col p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="text-brand">Kovault Financial</SheetTitle>
          </SheetHeader>
          <div
            className="flex-1 overflow-y-auto"
            onClick={() => setOpen(false)}
          >
            <SidebarNav />
          </div>
          <div className="border-t p-3">
            <div className="text-muted-foreground truncate px-1 pb-2 text-xs">
              {userEmail}
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
        </SheetContent>
      </Sheet>
    </div>
  )
}
