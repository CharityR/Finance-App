"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { addHoldingAction } from "@/app/(dashboard)/investments/actions"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SecurityOption = {
  id: string
  ticker: string
  name: string
  currency: string
}

const holdingFormSchema = z.object({
  securityId: z.string().uuid("Choose a security"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((v) => Number(v) > 0, "Quantity must be greater than zero"),
  purchasePrice: z
    .string()
    .min(1, "Purchase price is required")
    .refine((v) => Number(v) > 0, "Price must be greater than zero"),
})
type HoldingFormValues = z.infer<typeof holdingFormSchema>

export function HoldingForm({
  securities,
  trigger,
}: {
  securities: SecurityOption[]
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const form = useForm<HoldingFormValues>({
    resolver: zodResolver(holdingFormSchema),
    defaultValues: { securityId: "", quantity: "", purchasePrice: "" },
  })

  const securityItems = securities.map((s) => ({
    value: s.id,
    label: `${s.ticker} — ${s.name}`,
  }))
  const selectedId = form.watch("securityId")
  const selectedSecurity = securities.find((s) => s.id === selectedId)

  async function onSubmit(values: HoldingFormValues) {
    try {
      await addHoldingAction({
        securityId: values.securityId,
        quantity: Number(values.quantity),
        purchasePrice: Number(values.purchasePrice),
      })
      toast.success("Holding added")
      form.reset({ securityId: "", quantity: "", purchasePrice: "" })
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
          <DialogTitle>Add holding</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="securityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security</FormLabel>
                  <Select
                    items={securityItems}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Search by ticker or name" />
                    </SelectTrigger>
                    <SelectContent>
                      {securityItems.map((item) => (
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.000001" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Purchase price per share
                    {selectedSecurity ? ` (${selectedSecurity.currency})` : ""}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Add holding
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
