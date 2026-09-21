"use client"

import {
  Eye,
  LayoutDashboard,
  LineChart,
  Settings,
  Target,
  TrendingUp,
  Wallet,
  Wallet2,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "cn"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Wallet },
  { href: "/budgets", label: "Budgets", icon: Wallet2 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/investments", label: "Investments", icon: LineChart },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
