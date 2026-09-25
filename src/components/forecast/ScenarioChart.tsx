"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { formatMoney, formatMoneyCompact } from "@/lib/money"
import type { ScenarioSeries } from "@/lib/forecast"

const SCENARIO_COLORS = {
  conservative: "#64748b",
  base: "#2563eb",
  optimistic: "#16a34a",
}
const SCENARIO_LABELS = {
  conservative: "Conservative (4%)",
  base: "Base (8%)",
  optimistic: "Optimistic (12%)",
}

export function ScenarioChart({
  scenarios,
  currency,
}: {
  scenarios: ScenarioSeries
  currency: string
}) {
  const years = scenarios.base.map((p) => p.year)
  const data = years.map((year, i) => ({
    year: `Yr ${year}`,
    conservative: scenarios.conservative[i]?.value ?? null,
    base: scenarios.base[i]?.value ?? null,
    optimistic: scenarios.optimistic[i]?.value ?? null,
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) => formatMoneyCompact(v, currency)}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip
                {...props}
                formatValue={(v) => formatMoney(v, currency)}
              />
            )}
          />
          <Legend
            formatter={(name) =>
              SCENARIO_LABELS[name as keyof typeof SCENARIO_LABELS] ?? name
            }
          />
          <Line
            type="monotone"
            dataKey="optimistic"
            name={SCENARIO_LABELS.optimistic}
            stroke={SCENARIO_COLORS.optimistic}
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="base"
            name={SCENARIO_LABELS.base}
            stroke={SCENARIO_COLORS.base}
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="conservative"
            name={SCENARIO_LABELS.conservative}
            stroke={SCENARIO_COLORS.conservative}
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
