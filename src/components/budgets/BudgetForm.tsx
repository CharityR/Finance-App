"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { saveBudgetAction } from "@/app/(dashboard)/budgets/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type CategoryOption = { id: string; name: string }

type FormValues = Record<string, string>

export function BudgetForm({
  categories,
  existingLimits,
  trigger,
}: {
  categories: CategoryOption[]
  existingLimits: Record<string, number>
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: Object.fromEntries(
      categories.map((c) => [c.id, existingLimits[c.id]?.toString() ?? ""])
    ),
  })

  async function onSubmit(values: FormValues) {
    const limits: { categoryId: string; limitAmount: number }[] = []

    for (const [categoryId, raw] of Object.entries(values)) {
      if (!raw.trim()) continue
      const amount = Number(raw)
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Limits must be positive numbers")
        return
      }
      limits.push({ categoryId, limitAmount: amount })
    }

    try {
      await saveBudgetAction(limits)
      toast.success("Budget saved")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>This month&apos;s budget</DialogTitle>
          <DialogDescription>
            Set a spending limit per category. Leave blank to skip a category.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <Label className="w-32 shrink-0 text-sm">{c.name}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No limit"
                  {...form.register(c.id)}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
