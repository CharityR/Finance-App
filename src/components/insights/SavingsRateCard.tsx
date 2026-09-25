"use client"

import { useState } from "react"

import { AnimatedNumber } from "@/components/ui/animated-number"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tilt } from "@/components/ui/tilt"
import { formatMoney } from "@/lib/money"
import type { SavingsRatePoint } from "@/server/services/insights.service"

function monthLabel(periodMonth: string) {
  return new Date(`${periodMonth}T00:00:00.000Z`).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  })
}

/** Click to see the income/expense numbers behind each month's rate,
 * instead of the headline percentage being the only thing on offer. */
export function SavingsRateCard({
  trend,
  currency,
}: {
  trend: SavingsRatePoint[]
  currency: string
}) {
  const [open, setOpen] = useState(false)
  const currentMonth = trend[trend.length - 1]

  return (
    <>
      <Tilt>
        <Card
          className="hover:bg-muted/40 cursor-pointer transition-colors"
          onClick={() => setOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Savings rate (this month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-semibold ${
                (currentMonth?.savingsRate ?? 0) >= 0
                  ? "text-green-600"
                  : "text-destructive"
              }`}
            >
              <AnimatedNumber
                value={currentMonth?.savingsRate ?? 0}
                kind="percent"
                decimals={0}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Estimated · of income kept, not spent · tap for the monthly
              breakdown
            </p>
          </CardContent>
        </Card>
      </Tilt>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Savings rate, last {trend.length} months</DialogTitle>
            <DialogDescription>
              (Income − expenses) ÷ income, per month.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y">
            {[...trend].reverse().map((p) => (
              <div
                key={p.periodMonth}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{monthLabel(p.periodMonth)}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatMoney(p.income, currency)} in ·{" "}
                    {formatMoney(p.expense, currency)} out
                  </p>
                </div>
                <p
                  className={`font-medium ${p.savingsRate >= 0 ? "text-green-600" : "text-destructive"}`}
                >
                  {p.savingsRate.toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
