"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip } from "@/components/ui/chart-tooltip"
import type { SavingsRatePoint } from "@/server/services/insights.service"

function monthLabel(periodMonth: string) {
  return new Date(`${periodMonth}T00:00:00.000Z`).toLocaleDateString("en-NG", {
    month: "short",
  })
}

export function SavingsRateChart({ trend }: { trend: SavingsRatePoint[] }) {
  const monthsWithActivity = trend.filter(
    (p) => p.income > 0 || p.expense > 0
  ).length

  // A trend line across mostly-empty months (no transactions recorded yet)
  // reads as a flat line at 0% with one real point — not a chart worth a
  // full h-56 of screen space. Say so plainly instead.
  if (monthsWithActivity < 2) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Not enough history yet — the trend line will fill in as you log
        transactions across more months.
      </p>
    )
  }

  const data = trend.map((p) => ({
    month: monthLabel(p.periodMonth),
    "Savings rate": Math.round(p.savingsRate * 10) / 10,
  }))

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip {...props} formatValue={(v) => `${v}%`} />
            )}
          />
          <Line
            type="monotone"
            dataKey="Savings rate"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
