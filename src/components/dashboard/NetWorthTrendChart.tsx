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
import { formatMoney, formatMoneyCompact } from "@/lib/money"
import type { NetWorthTrendPoint } from "@/server/services/net-worth.service"

function monthLabel(periodMonth: string) {
  return new Date(`${periodMonth}T00:00:00.000Z`).toLocaleDateString("en-NG", {
    month: "short",
  })
}

export function NetWorthTrendChart({
  trend,
  currency,
}: {
  trend: NetWorthTrendPoint[]
  currency: string
}) {
  const data = trend.map((p) => ({
    month: monthLabel(p.periodMonth),
    "Net worth": p.total,
  }))

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
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
          <Line
            type="monotone"
            dataKey="Net worth"
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
