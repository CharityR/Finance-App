"use client"

import { ChevronDown, LineChart, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Fragment, useState, useTransition } from "react"
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
import { EditHoldingDialog } from "@/components/investments/EditHoldingDialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { TickerAvatar } from "@/components/ui/ticker-avatar"
import { formatMoney } from "@/lib/money"
import type { HoldingValuation } from "@/server/services/holdings.service"

/** Rows are compact by default (Security / Value / Gain-Loss) — click a row
 * to expand quantity, cost basis, price provenance, and the edit/remove
 * actions, rather than spreading every column for every holding at once. */
export function HoldingsTable({ holdings }: { holdings: HoldingValuation[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      <EmptyState
        icon={LineChart}
        title="No holdings yet"
        description="Add your first one to start tracking your portfolio's value and performance."
        compact
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Security</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">Gain/Loss</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((h) => {
            const isOpen = expandedId === h.id
            return (
              <Fragment key={h.id}>
                <TableRow
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : h.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <TickerAvatar ticker={h.ticker} />
                      <div>
                        <span className="font-medium">{h.ticker}</span>
                        <div className="text-muted-foreground text-xs">
                          {h.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(h.currentValue, h.currency)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      h.gainLoss >= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {h.gainLoss >= 0 ? "+" : ""}
                    {h.gainLossPercent.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <ChevronDown
                      className={`text-muted-foreground size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={4} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-6 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Quantity
                            </p>
                            <p className="font-medium">
                              {h.quantity.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Avg. cost
                            </p>
                            <p className="font-medium">
                              {formatMoney(h.averageCostBasis, h.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Price
                            </p>
                            <p className="font-medium">
                              {h.currentPrice !== null ? (
                                <>
                                  {formatMoney(h.currentPrice, h.currency)}
                                  <Badge variant="outline" className="ml-1.5">
                                    {h.priceProvenance === "current"
                                      ? "Live"
                                      : "Estimated"}
                                  </Badge>
                                </>
                              ) : (
                                <>
                                  {formatMoney(h.averageCostBasis, h.currency)}
                                  <Badge variant="outline" className="ml-1.5">
                                    Estimated
                                  </Badge>
                                </>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Gain/Loss
                            </p>
                            <p
                              className={`font-medium ${h.gainLoss >= 0 ? "text-positive" : "text-negative"}`}
                            >
                              {h.gainLoss >= 0 ? "+" : ""}
                              {formatMoney(h.gainLoss, h.currency)}
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/investments/${h.ticker}`} />}
                          >
                            View detail
                          </Button>
                          <EditHoldingDialog
                            holding={{
                              id: h.id,
                              ticker: h.ticker,
                              quantity: h.quantity,
                              averageCostBasis: h.averageCostBasis,
                              currency: h.currency,
                            }}
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <span className="sr-only">Edit</span>
                                <Pencil />
                              </Button>
                            }
                          />
                          <AlertDialog
                            open={openDeleteId === h.id}
                            onOpenChange={(open) =>
                              setOpenDeleteId(open ? h.id : null)
                            }
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
                                <AlertDialogTitle>
                                  Remove this holding?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {h.ticker} ({h.quantity.toLocaleString()}{" "}
                                  shares) will be removed from your portfolio.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemove(h.id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
