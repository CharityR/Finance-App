"use client"

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import { ChartTooltip } from "@/components/ui/chart-tooltip"
import { formatMoney } from "@/lib/money"
import type { CategoryBreakdownItem } from "@/server/services/insights.service"

export function CategoryBreakdownChart({
  items,
  currency,
}: {
  items: CategoryBreakdownItem[]
  currency: string
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No expenses recorded this month yet.
      </p>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={items}
            dataKey="total"
            nameKey="categoryName"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            animationDuration={800}
          >
            {items.map((item) => (
              <Cell key={item.categoryId ?? "none"} fill={item.color} />
            ))}
          </Pie>
          <Tooltip
            content={(props) => (
              <ChartTooltip
                {...props}
                formatValue={(v) => formatMoney(v, currency)}
              />
            )}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
