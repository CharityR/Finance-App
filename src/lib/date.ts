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
