"use client"

import { Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { removeHoldingAction } from "@/app/(dashboard)/investments/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/money"
import type { HoldingValuation } from "@/server/services/holdings.service"

export function HoldingsTable({ holdings }: { holdings: HoldingValuation[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)

  function handleRemove(id: string) {
    startTransition(async () => {
      try {
        await removeHoldingAction(id)
        toast.success("Holding removed")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove")
      } finally {
        setOpenDeleteId(null)
      }
    })
  }

  if (holdings.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        No holdings yet. Add your first one to start tracking your portfolio.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Security</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Avg. cost</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">Gain/Loss</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((h) => (
            <TableRow key={h.id}>
              <TableCell>
                <Link
                  href={`/investments/${h.ticker}`}
                  className="font-medium hover:underline"
                >
                  {h.ticker}
                </Link>
                <div className="text-muted-foreground text-xs">{h.name}</div>
              </TableCell>
              <TableCell className="text-right">
                {h.quantity.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(h.averageCostBasis, h.currency)}
              </TableCell>
              <TableCell className="text-right">
                {h.currentPrice !== null ? (
                  <div>
                    {formatMoney(h.currentPrice, h.currency)}
                    <Badge variant="outline" className="ml-1.5">
                      Current
                    </Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {formatMoney(h.averageCostBasis, h.currency)}
                    <Badge variant="outline" className="ml-1.5">
                      Estimated
                    </Badge>
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatMoney(h.currentValue, h.currency)}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  h.gainLoss >= 0 ? "text-green-600" : "text-destructive"
                }`}
              >
                {h.gainLoss >= 0 ? "+" : ""}
                {formatMoney(h.gainLoss, h.currency)}
                <div className="text-xs font-normal">
                  {h.gainLossPercent >= 0 ? "+" : ""}
                  {h.gainLossPercent.toFixed(1)}%
                </div>
              </TableCell>
              <TableCell>
                <AlertDialog
                  open={openDeleteId === h.id}
                  onOpenChange={(open) => setOpenDeleteId(open ? h.id : null)}
                >
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                      >
                        <span className="sr-only">Remove</span>
                        <Trash2 />
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove this holding?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {h.ticker} ({h.quantity.toLocaleString()} shares) will
                        be removed from your portfolio.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemove(h.id)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
