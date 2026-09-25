import { AnimatedNumber } from "@/components/ui/animated-number"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PortfolioSummaryForCurrency } from "@/server/services/portfolio.service"

/** A stacked, sidebar-width alternative to PortfolioSummaryCard's 3-column
 * grid, which is too wide for a narrow rail. */
export function GainLossSidebarCard({
  summary,
}: {
  summary: PortfolioSummaryForCurrency
}) {
  const isGain = summary.totalGainLoss >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Gain / loss ({summary.currency})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Value</span>
          <span className="font-medium">
            <AnimatedNumber
              value={summary.totalValue}
              kind="money"
              currency={summary.currency}
            />
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Cost basis</span>
          <span className="font-medium">
            <AnimatedNumber
              value={summary.totalCostBasis}
              kind="money"
              currency={summary.currency}
            />
          </span>
        </div>
        <div className="border-border/60 flex items-center justify-between border-t pt-2.5 text-sm">
          <span className="text-muted-foreground">Gain / loss</span>
          <span
            className={`font-medium ${isGain ? "text-positive" : "text-negative"}`}
          >
            <AnimatedNumber
              value={summary.totalGainLoss}
              kind="money"
              currency={summary.currency}
              showPositiveSign={isGain}
            />{" "}
            <AnimatedNumber
              value={summary.totalGainLossPercent}
              kind="percent"
              decimals={1}
              showPositiveSign={isGain}
            />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
