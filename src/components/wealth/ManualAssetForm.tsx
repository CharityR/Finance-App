"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  createManualAssetAction,
  updateManualAssetAction,
} from "@/app/(dashboard)/wealth/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/money-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { manualAssetCategoryEnum } from "@/server/db/schema"

// Only currencies a seeded fx_rates pair actually supports — a wider list
// here would let a save succeed but the net-worth aggregation later throw
// on conversion.
const CURRENCY_ITEMS = [
  { value: "NGN", label: "Nigerian Naira (₦)" },
  { value: "USD", label: "US Dollar ($)" },
]

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  country: z.string().min(1, "Country is required"),
  currency: z.string().min(1),
  value: z
    .string()
    .min(1, "Value is required")
    .refine((v) => Number(v) > 0, "Value must be greater than zero"),
  notes: z.string().max(1000).optional(),
})
type FormValues = z.infer<typeof formSchema>

type EditableAsset = {
  id: string
  name: string
  country: string
  currency: string
  value: string
  notes: string | null
}

function toDefaults(asset?: EditableAsset): FormValues {
  if (!asset) {
    return { name: "", country: "", currency: "NGN", value: "", notes: "" }
  }
  return {
    name: asset.name,
    country: asset.country,
    currency: asset.currency,
    value: String(Number(asset.value)),
    notes: asset.notes ?? "",
  }
}

export function ManualAssetForm({
  category,
  asset,
  trigger,
}: {
  category: (typeof manualAssetCategoryEnum.enumValues)[number]
  asset?: EditableAsset
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isEditing = !!asset

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaults(asset),
  })

  async function onSubmit(values: FormValues) {
    const payload = {
      category,
      name: values.name,
      country: values.country,
      currency: values.currency,
      value: Number(values.value),
      notes: values.notes || undefined,
    }

    try {
      if (isEditing) {
        await updateManualAssetAction(asset.id, payload)
        toast.success("Saved")
      } else {
        await createManualAssetAction(payload)
        toast.success("Added")
        form.reset(toDefaults())
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const label = category === "real_estate" ? "property" : "asset"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${label}` : `Add ${label}`}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        category === "real_estate"
                          ? "e.g. Lekki Apartment"
                          : "e.g. Gold bars"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nigeria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      items={CURRENCY_ITEMS}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_ITEMS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any extra detail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEditing ? "Save changes" : `Add ${label}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
