"use client"

import { Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { removeFromWatchlistAction } from "@/app/(dashboard)/watchlist/actions"
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
import type { WatchlistItemWithPrice } from "@/server/services/watchlist.service"

export function WatchlistTable({ items }: { items: WatchlistItemWithPrice[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRemove(id: string) {
    startTransition(async () => {
      try {
        await removeFromWatchlistAction(id)
        toast.success("Removed from watchlist")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove")
      }
    })
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        Your watchlist is empty. Add a security to keep an eye on it.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Security</TableHead>
            <TableHead>Sector / Country</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Link
                  href={`/investments/${item.ticker}`}
                  className="font-medium hover:underline"
                >
                  {item.ticker}
                </Link>
                <div className="text-muted-foreground text-xs">{item.name}</div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.sector ?? "—"} · {item.country}
              </TableCell>
              <TableCell className="text-right">
                {item.currentPrice !== null ? (
                  <>
                    {formatMoney(item.currentPrice, item.currency)}{" "}
                    <Badge variant="outline">Current</Badge>
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  item.priceChangePercent === null
                    ? "text-muted-foreground"
                    : item.priceChangePercent >= 0
                      ? "text-green-600"
                      : "text-destructive"
                }`}
              >
                {item.priceChangePercent !== null
                  ? `${item.priceChangePercent >= 0 ? "+" : ""}${item.priceChangePercent.toFixed(2)}%`
                  : "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => handleRemove(item.id)}
                >
                  <span className="sr-only">Remove</span>
                  <Trash2 />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
