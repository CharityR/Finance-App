"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { addToWatchlistAction } from "@/app/(dashboard)/watchlist/actions"
import {
  SecuritySearchInput,
  type SelectedSecurity,
} from "@/components/securities/SecuritySearchInput"
import { Button } from "@/components/ui/button"

export function WatchlistForm() {
  const router = useRouter()
  const [security, setSecurity] = useState<SelectedSecurity | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAdd() {
    if (!security) return
    setIsSubmitting(true)
    try {
      await addToWatchlistAction(security.id)
      toast.success("Added to watchlist")
      setSecurity(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <div className="w-72">
        <SecuritySearchInput value={security} onChange={setSecurity} />
      </div>
      <Button onClick={handleAdd} disabled={!security || isSubmitting}>
        Add
      </Button>
    </div>
  )
}
