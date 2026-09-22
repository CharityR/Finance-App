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

import { formatMoney } from "@/lib/money"

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
    price: Number(h.price),
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
            width={80}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => formatMoney(v, currency)}
          />
          <Tooltip
            formatter={(v) => [formatMoney(Number(v ?? 0), currency), "Price"]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
