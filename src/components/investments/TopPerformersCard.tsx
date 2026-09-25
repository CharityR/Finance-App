import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TickerAvatar } from "@/components/ui/ticker-avatar"
import type { HoldingValuation } from "@/server/services/holdings.service"

/** Best/worst movers in the selected currency, by gain/loss % — a glanceable
 * "what's working" summary instead of needing to scan the full table. */
export function TopPerformersCard({
  holdings,
}: {
  holdings: HoldingValuation[]
}) {
  if (holdings.length === 0) return null

  const ranked = [...holdings].sort(
    (a, b) => b.gainLossPercent - a.gainLossPercent
  )
  const top = ranked.slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Top performers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.map((h) => (
          <div key={h.id} className="flex items-center gap-2.5">
            <TickerAvatar ticker={h.ticker} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{h.ticker}</p>
            </div>
            <p
              className={`text-sm font-medium ${h.gainLossPercent >= 0 ? "text-positive" : "text-negative"}`}
            >
              {h.gainLossPercent >= 0 ? "+" : ""}
              {h.gainLossPercent.toFixed(1)}%
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
