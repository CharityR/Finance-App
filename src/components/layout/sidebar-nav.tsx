"use client"

import {
  Eye,
  LayoutDashboard,
  LineChart,
  Lightbulb,
  Settings,
  Target,
  TrendingUp,
  Wallet,
  Wallet2,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "cn"

// Same routes, same order as before — grouped only for visual hierarchy
// (spacing + a small group label), so investment-related areas (Investments,
// Watchlist, Forecast) read as related without touching the URL structure
// or removing anything.
const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/transactions", label: "Transactions", icon: Wallet },
      { href: "/budgets", label: "Budgets", icon: Wallet2 },
      { href: "/goals", label: "Goals", icon: Target },
    ],
  },
  {
    label: "Investing",
    items: [
      { href: "/investments", label: "Investments", icon: LineChart },
      { href: "/watchlist", label: "Watchlist", icon: Eye },
      { href: "/forecast", label: "Forecast", icon: TrendingUp },
    ],
  },
  {
    label: null,
    items: [
      { href: "/insights", label: "Insights", icon: Lightbulb },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-4 p-3">
      {NAV_GROUPS.map((group, i) => (
        <div key={i} className="flex flex-col gap-1">
          {group.label && (
            <p className="text-muted-foreground/70 px-3 pb-1 text-[11px] font-semibold tracking-wide uppercase">
              {group.label}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon }) => {
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
        </div>
      ))}
    </nav>
  )
}
