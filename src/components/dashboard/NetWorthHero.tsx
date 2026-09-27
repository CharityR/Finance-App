"use client"

import { useMemo, useState } from "react"

import { NetWorthTrendChart } from "@/components/dashboard/NetWorthTrendChart"
import { ToggleButtonGroup } from "@/components/ui/toggle-button-group"
import { formatMoneyParts } from "@/lib/money"
import type { NetWorthSummary } from "@/server/services/net-worth.service"

const TIMEFRAME_MONTHS: Record<string, number> = { "1M": 2, "3M": 3, "6M": 6 }
// Only real, working ranges — 1Y/5Y/ALL aren't offered at all rather than
// shown disabled: seed price history is too short to back them honestly,
// and a greyed-out control that never works is worse than not having it.
const TIMEFRAME_OPTIONS = [
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
]

/**
 * The one place net worth's total renders on the page — AnimatedNumber must
 * never also appear for the same figure elsewhere (see animated-number.tsx's
 * own warning about two simultaneous instances visibly disagreeing).
 */
export function NetWorthHero({
  summaries,
}: {
  summaries: NetWorthSummary[]
}) {
  const [currencyIndex, setCurrencyIndex] = useState(0)
  const [timeframe, setTimeframe] = useState("6M")

  const summary = summaries[currencyIndex]
  const trendSlice = useMemo(() => {
    const months = TIMEFRAME_MONTHS[timeframe] ?? 6
    return summary.trend.slice(-months)
  }, [summary, timeframe])

  const isGrowth = summary.monthOverMonthChange.value >= 0
  const total = formatMoneyParts(summary.total.value, summary.reportingCurrency)
  const change = formatMoneyParts(
    Math.abs(summary.monthOverMonthChange.value),
    summary.reportingCurrency
  )

  return (
    <section className="space-y-4 border-b pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Net worth</p>
          {/* The currency symbol renders at a smaller size than the digits —
              at 4xl, the Naira sign's double horizontal bar reads as a
              strikethrough across the whole number otherwise. */}
          <div className="text-4xl font-semibold tracking-tight">
            <span className="text-2xl">{total.symbol}</span>
            {total.number}
          </div>
          <p
            className={`mt-1 text-sm font-medium ${isGrowth ? "text-positive" : "text-negative"}`}
          >
            {isGrowth ? "+" : "-"}
            {change.symbol}
            {change.number} ({isGrowth ? "+" : ""}
            {summary.monthOverMonthChangePercent.value.toFixed(1)}%) this
            month
          </p>
        </div>

        {summaries.length > 1 && (
          <div className="space-y-1.5 text-right">
            <p className="text-muted-foreground text-xs">
              Reporting currency
            </p>
            <ToggleButtonGroup
              options={summaries.map((s, i) => ({
                value: String(i),
                label: s.reportingCurrency,
              }))}
              value={String(currencyIndex)}
              onChange={(v) => setCurrencyIndex(Number(v))}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            Net worth trend — estimated from account and holding history
          </p>
          <ToggleButtonGroup
            options={TIMEFRAME_OPTIONS}
            value={timeframe}
            onChange={setTimeframe}
          />
        </div>
        <NetWorthTrendChart
          trend={trendSlice}
          currency={summary.reportingCurrency}
        />
      </div>
    </section>
  )
}
