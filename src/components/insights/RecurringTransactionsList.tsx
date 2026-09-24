import { formatMoney } from "@/lib/money"
import type { RecurringTransaction } from "@/server/services/insights.service"

export function RecurringTransactionsList({
  items,
}: {
  items: RecurringTransaction[]
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nothing recurring detected yet — this needs at least 3 months of similar
        transactions to spot a pattern.
      </p>
    )
  }

  return (
    <div className="divide-y">
      {items.map((item) => (
        <div
          key={`${item.categoryId ?? "none"}-${item.description}`}
          className="flex items-center justify-between py-2.5"
        >
          <div>
            <p className="text-sm font-medium capitalize">{item.description}</p>
            <p className="text-muted-foreground text-xs">
              {item.categoryName} · seen {item.occurrences}x
            </p>
          </div>
          <p className="text-sm font-medium">
            {formatMoney(item.averageAmount, item.currency)}
            <span className="text-muted-foreground">/mo</span>
          </p>
        </div>
      ))}
    </div>
  )
}
