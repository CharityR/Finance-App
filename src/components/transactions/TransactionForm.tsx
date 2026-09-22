"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  createTransactionAction,
  updateTransactionAction,
} from "@/app/(dashboard)/transactions/actions"
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

type CategoryOption = {
  id: string
  name: string
  type: "income" | "expense"
}

const TYPE_ITEMS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
]

const transactionFormSchema = z.object({
  categoryId: z.union([z.string().uuid(), z.literal("")]),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  currency: z.string().min(1),
  type: z.enum(["income", "expense"]),
  description: z.string().max(500).optional(),
  occurredAt: z.string().min(1, "Date is required"),
})
type TransactionFormValues = z.infer<typeof transactionFormSchema>

type EditableTransaction = {
  id: string
  categoryId: string | null
  amount: string
  currency: string
  type: "income" | "expense"
  description: string | null
  occurredAt: string | Date
}

function toFormDefaults(
  transaction?: EditableTransaction
): TransactionFormValues {
  if (!transaction) {
    return {
      categoryId: "",
      amount: "",
      currency: "NGN",
      type: "expense",
      description: "",
      occurredAt: new Date().toISOString().slice(0, 10),
    }
  }
  return {
    categoryId: transaction.categoryId ?? "",
    amount: String(Number(transaction.amount)),
    currency: transaction.currency,
    type: transaction.type,
    description: transaction.description ?? "",
    occurredAt: new Date(transaction.occurredAt).toISOString().slice(0, 10),
  }
}

export function TransactionForm({
  categories,
  transaction,
  trigger,
}: {
  categories: CategoryOption[]
  transaction?: EditableTransaction
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isEditing = !!transaction

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: toFormDefaults(transaction),
  })

  const selectedType = form.watch("type")
  const currency = form.watch("currency")
  const filteredCategoryItems = categories
    .filter((c) => c.type === selectedType)
    .map((c) => ({ value: c.id, label: c.name }))

  async function onSubmit(values: TransactionFormValues) {
    try {
      const payload = {
        ...values,
        categoryId: values.categoryId || null,
        amount: Number(values.amount),
        occurredAt: new Date(values.occurredAt),
      }
      if (isEditing) {
        await updateTransactionAction(transaction.id, payload)
        toast.success("Transaction updated")
      } else {
        await createTransactionAction(payload)
        toast.success("Transaction added")
        form.reset(toFormDefaults())
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    items={TYPE_ITEMS}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue("categoryId", "")
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_ITEMS.map((item) => (
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    items={filteredCategoryItems}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategoryItems.map((item) => (
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ({currency})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEditing ? "Save changes" : "Add transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
