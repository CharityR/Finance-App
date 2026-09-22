"use client"

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import type { AllocationSlice } from "@/server/services/portfolio.service"

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#eab308",
  "#64748b",
]

export function AllocationChart({ slices }: { slices: AllocationSlice[] }) {
  if (slices.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No holdings yet.
      </p>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="percentage"
            nameKey="label"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {slices.map((slice, i) => (
              <Cell key={slice.label} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
