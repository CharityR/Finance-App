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

export function PriceHistoryChart({
  history,
  currency,
}: {
  history: { price: string; fetchedAt: Date }[]
  currency: string
}) {
  const data = [...history].reverse().map((h) => ({
    date: new Date(h.fetchedAt).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    }),
    Price: Number(h.price),
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            domain={["auto", "auto"]}
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
            dataKey="Price"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
