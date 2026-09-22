"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { addToWatchlistAction } from "@/app/(dashboard)/watchlist/actions"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SecurityOption = { id: string; ticker: string; name: string }

export function WatchlistForm({
  securities,
}: {
  securities: SecurityOption[]
}) {
  const router = useRouter()
  const [securityId, setSecurityId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const items = securities.map((s) => ({
    value: s.id,
    label: `${s.ticker} — ${s.name}`,
  }))

  async function handleAdd() {
    if (!securityId) return
    setIsSubmitting(true)
    try {
      await addToWatchlistAction(securityId)
      toast.success("Added to watchlist")
      setSecurityId("")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Select
        items={items}
        value={securityId}
        onValueChange={(value) => value && setSecurityId(value)}
      >
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Search by ticker or name" />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleAdd} disabled={!securityId || isSubmitting}>
        Add
      </Button>
    </div>
  )
}
