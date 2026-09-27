"use client"

import { Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { deleteManualAssetAction } from "@/app/(dashboard)/wealth/actions"
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
import { ManualAssetForm } from "@/components/wealth/ManualAssetForm"
import { formatMoney } from "@/lib/money"
import type { manualAssetCategoryEnum } from "@/server/db/schema"

type ManualAsset = {
  id: string
  name: string
  country: string
  currency: string
  value: string
  notes: string | null
}

export function ManualAssetRow({
  category,
  asset,
}: {
  category: (typeof manualAssetCategoryEnum.enumValues)[number]
  asset: ManualAsset
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteManualAssetAction(asset.id)
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
        <p className="font-medium">{asset.name}</p>
        <p className="text-muted-foreground text-xs">
          {asset.country}
          {asset.notes ? ` · ${asset.notes}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <p className="font-medium">
          {formatMoney(Number(asset.value), asset.currency)}
        </p>
        <ManualAssetForm
          category={category}
          asset={asset}
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
              <AlertDialogTitle>Remove &quot;{asset.name}&quot;?</AlertDialogTitle>
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
