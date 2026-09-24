/** Normalizes any date to "YYYY-MM-01", the key budgets are stored under. */
export function monthKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}-01`
}

/** [start, end) UTC bounds for the calendar month a "YYYY-MM-01" key names. */
export function monthRange(periodMonth: string) {
  const start = new Date(`${periodMonth}T00:00:00.000Z`)
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)
  )
  return { start, end }
}

/** The last `count` month keys, oldest first, ending with the current month. */
export function trailingMonthKeys(
  count: number,
  from: Date = new Date()
): string[] {
  const keys: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - i, 1)
    )
    keys.push(monthKey(d))
  }
  return keys
}

/** "3h ago" / "2d ago" style relative time for compact notification lists. */
export function formatRelativeTime(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date
  const seconds = Math.round((Date.now() - then.getTime()) / 1000)

  if (seconds < 60) return "just now"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return then.toLocaleDateString("en-NG", { month: "short", day: "numeric" })
}
