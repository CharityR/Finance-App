import { AnimatedNumber } from "@/components/ui/animated-number"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tilt } from "@/components/ui/tilt"
import { formatMoney } from "@/lib/money"
import type { BudgetCategoryProgress } from "@/server/services/budgets.service"

function ProgressBar({ percentage }: { percentage: number }) {
  const clamped = Math.min(percentage, 100)
  const isOver = percentage > 100
  return (
    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${isOver ? "bg-destructive" : "bg-primary"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export function BudgetCard({
  category,
  currency,
}: {
  category: BudgetCategoryProgress
  currency: string
}) {
  return (
    <Tilt>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {category.categoryName}
          </CardTitle>
          {category.isOverspent && <Badge variant="destructive">Over</Badge>}
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>
              <AnimatedNumber
                value={category.spent}
                kind="money"
                currency={currency}
                suffix=" spent"
              />
            </span>
            <span>
              <AnimatedNumber
                value={category.limitAmount}
                kind="money"
                currency={currency}
                suffix=" limit"
              />
            </span>
          </div>
          <ProgressBar percentage={category.percentage} />
          <p className="text-muted-foreground text-xs">
            {category.remaining >= 0
              ? `${formatMoney(category.remaining, currency)} remaining`
              : `${formatMoney(Math.abs(category.remaining), currency)} over budget`}
            {" · "}
            <AnimatedNumber
              value={category.percentage}
              kind="percent"
              decimals={0}
              suffix=" used"
            />
          </p>
        </CardContent>
      </Card>
    </Tilt>
  )
}
