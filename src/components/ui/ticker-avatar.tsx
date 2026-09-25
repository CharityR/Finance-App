import { cn } from "cn"

// Muted, Material-3-ish palette — no real logo source is wired up, so this
// is the "logo fallback badge": a deterministic colored initials avatar
// instead of every row starting with bare text.
const PALETTE = [
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#65a30d",
  "#0891b2",
  "#9333ea",
]

function colorFor(ticker: string): string {
  let hash = 0
  for (let i = 0; i < ticker.length; i++) {
    hash = (hash * 31 + ticker.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

const SIZE_CLASSES = {
  sm: "size-6 text-[10px]",
  default: "size-8 text-xs",
} as const

export function TickerAvatar({
  ticker,
  size = "default",
  className,
}: {
  ticker: string
  size?: keyof typeof SIZE_CLASSES
  className?: string
}) {
  const initials = ticker
    .replace(/[^A-Z0-9]/gi, "")
    .slice(0, 2)
    .toUpperCase()
  const color = colorFor(ticker)

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  )
}
