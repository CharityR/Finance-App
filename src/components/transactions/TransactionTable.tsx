"use client"

import { Pencil, Trash2, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { deleteTransactionAction } from "@/app/(dashboard)/transactions/actions"
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
import { CategoryIcon } from "@/components/ui/category-icon"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { formatMoney } from "@/lib/money"

type CategoryOption = { id: string; name: string; type: "income" | "expense" }

export type TransactionRow = {
  id: string
  categoryId: string | null
  amount: string
  currency: string
  // "transfer" isn't creatable/editable yet in Phase 1 (no UI path produces
  // one), but the DB enum allows it for future bank-sync use, so the type
  // here matches the full enum rather than narrowing what the DB can return.
  type: "income" | "expense" | "transfer"
  description: string | null
  occurredAt: Date
  category: { name: string; icon: string | null; color: string | null } | null
}

export function TransactionTable({
  transactions,
  categories,
}: {
  transactions: TransactionRow[]
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      try {
        await deleteTransactionAction(id)
        toast.success("Transaction deleted")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed")
      } finally {
        setDeletingId(null)
        setOpenDeleteId(null)
      }
    })
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No transactions yet"
        description="Add your first one to start tracking your income and expenses."
        compact
      />
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap">
                {new Date(t.occurredAt).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell className="max-w-48 truncate">
                {t.description || "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <CategoryIcon
                    icon={t.category?.icon ?? null}
                    color={t.category?.color ?? null}
                    size="sm"
                  />
                  {t.category?.name ?? "Uncategorized"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={t.type === "income" ? "default" : "outline"}>
                  {t.type}
                </Badge>
              </TableCell>
              <TableCell
                className={`text-right font-medium whitespace-nowrap ${
                  t.type === "income" ? "text-positive" : "text-foreground"
                }`}
              >
                {t.type === "expense" ? "-" : t.type === "income" ? "+" : ""}
                {formatMoney(Number(t.amount), t.currency)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {t.type !== "transfer" && (
                    <TransactionForm
                      categories={categories}
                      transaction={{ ...t, type: t.type }}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <span className="sr-only">Edit</span>
                          <Pencil />
                        </Button>
                      }
                    />
                  )}
                  <AlertDialog
                    open={openDeleteId === t.id}
                    onOpenChange={(open) => setOpenDeleteId(open ? t.id : null)}
                  >
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isPending && deletingId === t.id}
                        >
                          <span className="sr-only">Delete</span>
                          <Trash2 />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete this transaction?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.description || "This transaction"} —{" "}
                          {formatMoney(Number(t.amount), t.currency)} will be
                          removed from your records.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(t.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
