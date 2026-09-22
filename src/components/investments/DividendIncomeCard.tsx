import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import type { DividendIncomeByCurrency } from "@/server/services/dividend-income.service"

export function DividendIncomeCard({
  incomeByCurrency,
}: {
  incomeByCurrency: DividendIncomeByCurrency[]
}) {
  if (incomeByCurrency.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimated dividend income</CardTitle>
        <CardDescription className="space-y-1">
          {incomeByCurrency.map((group) => (
            <span key={group.currency} className="block">
              {formatMoney(group.totalEstimatedAnnualIncome, group.currency)}
              /year across {group.breakdown.length} holding
              {group.breakdown.length === 1 ? "" : "s"}
            </span>
          ))}
          <span className="text-muted-foreground/80 block text-xs">
            Estimated from mock dividend data — not a guarantee.
          </span>
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
