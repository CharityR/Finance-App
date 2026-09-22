import { AnimatedNumber } from "@/components/ui/animated-number"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tilt } from "@/components/ui/tilt"
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
      <Tilt>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Portfolio value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              <AnimatedNumber
                value={summary.totalValue}
                kind="money"
                currency={currency}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Current · {summary.holdingCount} holding
              {summary.holdingCount === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      </Tilt>
      <Tilt>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Cost basis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              <AnimatedNumber
                value={summary.totalCostBasis}
                kind="money"
                currency={currency}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Actual</p>
          </CardContent>
        </Card>
      </Tilt>
      <Tilt>
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
              <AnimatedNumber
                value={summary.totalGainLoss}
                kind="money"
                currency={currency}
                showPositiveSign={isGain}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Estimated ·{" "}
              <AnimatedNumber
                value={summary.totalGainLossPercent}
                kind="percent"
                decimals={1}
                showPositiveSign={isGain}
              />
            </p>
          </CardContent>
        </Card>
      </Tilt>
    </div>
  )
}
