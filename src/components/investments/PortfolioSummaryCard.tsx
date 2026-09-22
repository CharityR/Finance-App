import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import type { PortfolioSummaryForCurrency } from "@/server/services/portfolio.service"

export function PortfolioSummaryCard({
  summary,
  currency,
}: {
  summary: PortfolioSummaryForCurrency
  currency: string
}) {
  const isGain = summary.totalGainLoss >= 0

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-normal">
            Portfolio value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {formatMoney(summary.totalValue, currency)}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Current · {summary.holdingCount} holding
            {summary.holdingCount === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-normal">
            Cost basis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {formatMoney(summary.totalCostBasis, currency)}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">Actual</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-normal">
            Gain / Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-semibold ${isGain ? "text-green-600" : "text-destructive"}`}
          >
            {isGain ? "+" : ""}
            {formatMoney(summary.totalGainLoss, currency)}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Estimated · {isGain ? "+" : ""}
            {summary.totalGainLossPercent.toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
