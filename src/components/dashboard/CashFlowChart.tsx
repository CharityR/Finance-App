"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { formatMoney, formatMoneyCompact } from "@/lib/money"

export function CashFlowChart({
  income,
  expense,
  currency,
}: {
  income: number
  expense: number
  currency: string
}) {
  const data = [{ name: "This month", Income: income, Expenses: expense }]

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) => formatMoneyCompact(v, currency)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={(props) => (
              <ChartTooltip
                {...props}
                formatValue={(v) => formatMoney(v, currency)}
              />
            )}
          />
          <Bar
            dataKey="Income"
            fill="var(--positive)"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
          />
          <Bar
            dataKey="Expenses"
            fill="var(--negative)"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
