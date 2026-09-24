"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { updateHoldingAction } from "@/app/(dashboard)/investments/actions"
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

const editHoldingFormSchema = z.object({
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((v) => Number(v) > 0, "Quantity must be greater than zero"),
  averageCostBasis: z
    .string()
    .min(1, "Average cost is required")
    .refine((v) => Number(v) > 0, "Average cost must be greater than zero"),
})
type EditHoldingFormValues = z.infer<typeof editHoldingFormSchema>

type EditableHolding = {
  id: string
  ticker: string
  quantity: number
  averageCostBasis: number
  currency: string
}

export function EditHoldingDialog({
  holding,
  trigger,
}: {
  holding: EditableHolding
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const form = useForm<EditHoldingFormValues>({
    resolver: zodResolver(editHoldingFormSchema),
    defaultValues: {
      quantity: String(holding.quantity),
      averageCostBasis: String(holding.averageCostBasis),
    },
  })

  async function onSubmit(values: EditHoldingFormValues) {
    try {
      await updateHoldingAction(holding.id, {
        quantity: Number(values.quantity),
        averageCostBasis: Number(values.averageCostBasis),
      })
      toast.success("Holding updated")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit {holding.ticker}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="averageCostBasis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Average cost per share ({holding.currency})
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
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
