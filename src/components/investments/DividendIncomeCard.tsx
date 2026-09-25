import { formatMoney } from "@/lib/money"
import type { DividendIncomeByCurrency } from "@/server/services/dividend-income.service"

/** Plain text, not its own bordered card — this renders inside a page
 * section that already has its own "Dividend income" heading, so wrapping
 * one or two lines of text in another card+border just adds visual noise
 * without grouping anything meaningfully. */
export function DividendIncomeCard({
  incomeByCurrency,
}: {
  incomeByCurrency: DividendIncomeByCurrency[]
}) {
  if (incomeByCurrency.length === 0) return null

  return (
    <div className="space-y-1 text-sm">
      {incomeByCurrency.map((group) => (
        <p key={group.currency} className="font-medium">
          {formatMoney(group.totalEstimatedAnnualIncome, group.currency)}
          /year across {group.breakdown.length} holding
          {group.breakdown.length === 1 ? "" : "s"}
        </p>
      ))}
      <p className="text-muted-foreground text-xs">
        Estimated from mock dividend data — not a guarantee.
      </p>
    </div>
  )
}
