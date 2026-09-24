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

import type { SavingsRatePoint } from "@/server/services/insights.service"

function monthLabel(periodMonth: string) {
  return new Date(`${periodMonth}T00:00:00.000Z`).toLocaleDateString("en-NG", {
    month: "short",
  })
}

export function SavingsRateChart({ trend }: { trend: SavingsRatePoint[] }) {
  const data = trend.map((p) => ({
    month: monthLabel(p.periodMonth),
    savingsRate: Math.round(p.savingsRate * 10) / 10,
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
          <Tooltip formatter={(v) => [`${v}%`, "Savings rate"]} />
          <Line
            type="monotone"
            dataKey="savingsRate"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
