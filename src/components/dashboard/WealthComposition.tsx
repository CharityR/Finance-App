import Link from "next/link"

import { HorizontalBar } from "@/components/ui/horizontal-bar"
import { formatMoney } from "@/lib/money"
import type { NetWorthComposition } from "@/server/services/net-worth.service"

const CATEGORY_HREF: Record<NetWorthComposition["category"], string> = {
  cash: "/transactions",
  investments: "/investments",
  real_estate: "/wealth/real-estate",
  other_assets: "/wealth/other-assets",
  liabilities: "/wealth/liabilities",
}

/** Horizontal bars, not the giant colored blocks the old NetWorthExplorer
 * treemap led with — each row answers "what is my wealth made of," and
 * clicking one drills into that category. */
export function WealthComposition({
  composition,
  currency,
}: {
  composition: NetWorthComposition[]
  currency: string
}) {
  return (
    <div className="space-y-3">
      {composition.map((row) => (
        <Link
          key={row.category}
          href={CATEGORY_HREF[row.category]}
          className="group block space-y-1.5"
        >
          <div className="flex items-baseline justify-between text-sm">
            <span className="group-hover:text-primary font-medium transition-colors">
              {row.label}
            </span>
            <span className="text-muted-foreground">
              {row.percentage.toFixed(0)}% ·{" "}
              {row.category === "liabilities" && row.value > 0 ? "-" : ""}
              {formatMoney(row.value, currency)}
            </span>
          </div>
          <HorizontalBar
            percentage={row.percentage}
            tone={row.category === "liabilities" ? "negative" : "primary"}
          />
        </Link>
      ))}
    </div>
  )
}
