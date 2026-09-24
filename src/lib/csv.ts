/** Quotes a field only when it needs it (contains a comma, quote, or
 * newline) — doubling any embedded quotes, per the CSV spec. */
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvField(String(cell))).join(",")
  )
  return lines.join("\r\n")
}
