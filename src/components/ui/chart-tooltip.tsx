"use client"

import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"
import type { TooltipContentProps } from "recharts"

/**
 * Shared glass tooltip for every Recharts chart in the app, replacing
 * Recharts' plain default box — `content={<ChartTooltip formatValue={...} />}`.
 * `formatValue` turns one series' raw value into the label/value pair shown
 * next to its color dot, so each chart controls its own formatting (money,
 * percent, compact vs. full precision) while sharing one visual shell.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: TooltipContentProps<ValueType, NameType> & {
  formatValue: (value: number, name: NameType) => string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="border-border/50 bg-popover/90 min-w-32 rounded-xl border p-3 text-sm shadow-lg backdrop-blur-md">
      {label !== undefined && label !== null && (
        <p className="mb-1.5 font-medium">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium">
              {formatValue(Number(entry.value ?? 0), entry.name ?? "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
