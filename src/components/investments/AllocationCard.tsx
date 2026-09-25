"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

import { AllocationChart } from "@/components/investments/AllocationChart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AllocationSlice } from "@/server/services/portfolio.service"

/** Collapsed by default — shows just the top slice so the page doesn't
 * spread a full donut chart per currency before the user asks for it. */
export function AllocationCard({
  slices,
  currency,
}: {
  slices: AllocationSlice[]
  currency: string
}) {
  const [open, setOpen] = useState(false)
  const top = [...slices].sort((a, b) => b.percentage - a.percentage)[0]

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
      >
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm">
              Asset allocation ({currency})
            </CardTitle>
            {!open && top && (
              <p className="text-muted-foreground mt-1 text-xs">
                Mostly {top.label} · {top.percentage.toFixed(0)}%
              </p>
            )}
          </div>
          <ChevronDown
            className={`text-muted-foreground size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </CardHeader>
      </button>
      {open && (
        <CardContent>
          <AllocationChart slices={slices} />
        </CardContent>
      )}
    </Card>
  )
}
