/**
 * Extracted from the near-identical progress bars duplicated in
 * BudgetCard.tsx and GoalCard.tsx — one shared track+fill implementation.
 */
export function HorizontalBar({
  percentage,
  tone = "primary",
}: {
  percentage: number
  tone?: "primary" | "negative"
}) {
  const clamped = Math.min(Math.max(percentage, 0), 100)
  return (
    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${
          tone === "negative" ? "bg-negative" : "bg-primary"
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
