"use client"

import { useState } from "react"
import { toast } from "sonner"

import { updateProfileAction } from "@/app/(dashboard)/settings/actions"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CURRENCY_ITEMS = [
  { value: "NGN", label: "Nigerian Naira (₦)" },
  { value: "USD", label: "US Dollar ($) — coming soon", disabled: true },
  { value: "GBP", label: "British Pound (£) — coming soon", disabled: true },
  { value: "EUR", label: "Euro (€) — coming soon", disabled: true },
]

export function CurrencyForm({ currentCurrency }: { currentCurrency: string }) {
  const [currency, setCurrency] = useState(currentCurrency)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      await updateProfileAction({ baseCurrency: currency as "NGN" })
      toast.success("Currency updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">Base currency</label>
        <Select
          items={CURRENCY_ITEMS}
          value={currency}
          onValueChange={(value) => value && setCurrency(value)}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_ITEMS.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
                disabled={item.disabled}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handleSave}
        disabled={isSaving || currency === currentCurrency}
      >
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  )
}
