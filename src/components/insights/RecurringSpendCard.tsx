"use client"

import { useState } from "react"

import { RecurringTransactionsList } from "@/components/insights/RecurringTransactionsList"
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
import type { RecurringTransaction } from "@/server/services/insights.service"

/** Click to see every recurring transaction behind the estimate, rather
 * than needing to scroll all the way down the page to find that list. */
export function RecurringSpendCard({
  recurring,
  estimatedMonthlyRecurring,
  currency,
}: {
  recurring: RecurringTransaction[]
  estimatedMonthlyRecurring: number
  currency: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tilt>
        <Card
          className="hover:bg-muted/40 cursor-pointer transition-colors"
          onClick={() => setOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Estimated recurring spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              <AnimatedNumber
                value={estimatedMonthlyRecurring}
                kind="money"
                currency={currency}
                suffix="/mo"
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Estimated · across {recurring.length} recurring transaction
              {recurring.length === 1 ? "" : "s"} · tap to see them
            </p>
          </CardContent>
        </Card>
      </Tilt>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Recurring transactions</DialogTitle>
            <DialogDescription>
              Detected from repeating amounts and descriptions.
            </DialogDescription>
          </DialogHeader>
          <RecurringTransactionsList items={recurring} />
        </DialogContent>
      </Dialog>
    </>
  )
}
