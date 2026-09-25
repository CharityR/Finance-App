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

import { formatMoney } from "@/lib/money"

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
            width={80}
            tickFormatter={(v: number) => formatMoney(v, currency)}
          />
          <Tooltip formatter={(v) => formatMoney(Number(v ?? 0), currency)} />
          <Bar dataKey="Income" fill="var(--positive)" radius={4} />
          <Bar dataKey="Expenses" fill="var(--negative)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
