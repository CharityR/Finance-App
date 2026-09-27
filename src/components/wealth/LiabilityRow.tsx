"use client"

import { Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { deleteLiabilityAction } from "@/app/(dashboard)/wealth/actions"
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
import { Button } from "@/components/ui/button"
import { LiabilityForm } from "@/components/wealth/LiabilityForm"
import { formatMoney } from "@/lib/money"
import { LIABILITY_CATEGORY_LABELS } from "@/lib/validation/liabilities"

type Liability = {
  id: string
  name: string
  category: string
  currency: string
  balance: string
  notes: string | null
}

export function LiabilityRow({ liability }: { liability: Liability }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteLiabilityAction(liability.id)
        toast.success("Removed")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove")
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="font-medium">{liability.name}</p>
        <p className="text-muted-foreground text-xs">
          {LIABILITY_CATEGORY_LABELS[
            liability.category as keyof typeof LIABILITY_CATEGORY_LABELS
          ] ?? liability.category}
          {liability.notes ? ` · ${liability.notes}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-negative font-medium">
          -{formatMoney(Number(liability.balance), liability.currency)}
        </p>
        <LiabilityForm
          liability={liability}
          trigger={
            <Button size="icon" variant="ghost" aria-label="Edit">
              <Pencil className="size-4" />
            </Button>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                size="icon"
                variant="ghost"
                aria-label="Delete"
                disabled={isPending}
              >
                <Trash2 className="size-4" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Remove &quot;{liability.name}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This removes it from your net worth composition. This can&apos;t
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
