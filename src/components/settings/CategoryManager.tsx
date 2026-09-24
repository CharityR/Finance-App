"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/(dashboard)/settings/actions"
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
import { cn } from "@/lib/utils"
import { CATEGORY_COLORS } from "@/lib/validation/categories"

type Category = {
  id: string
  name: string
  type: "income" | "expense"
  color: string | null
  isSystem: boolean
}

const TYPE_ITEMS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
]

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  type: z.enum(["income", "expense"]),
  color: z.enum(CATEGORY_COLORS),
})
type CategoryFormValues = z.infer<typeof categoryFormSchema>

function ColorSwatchPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "ring-offset-background size-7 rounded-full ring-2 ring-offset-2 transition-transform",
            value === color
              ? "ring-foreground scale-110"
              : "ring-transparent hover:scale-105"
          )}
          style={{ backgroundColor: color }}
        >
          <span className="sr-only">{color}</span>
        </button>
      ))}
    </div>
  )
}

function CategoryFormDialog({
  category,
  trigger,
}: {
  category?: Category
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isEditing = !!category

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? "expense",
      color:
        (category?.color as (typeof CATEGORY_COLORS)[number]) ??
        CATEGORY_COLORS[0],
    },
  })

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (isEditing) {
        await updateCategoryAction(category.id, {
          name: values.name,
          color: values.color,
        })
        toast.success("Category updated")
      } else {
        await createCategoryAction(values)
        toast.success("Category added")
        form.reset()
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit category" : "New category"}
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
                    <Input placeholder="e.g. Pet Care" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      items={TYPE_ITEMS}
                      value={field.value}
                      onValueChange={field.onChange}
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
            )}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <ColorSwatchPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEditing ? "Save changes" : "Add category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function CategoryRow({ category }: { category: Category }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleDelete() {
    try {
      await deleteCategoryAction(category.id)
      toast.success("Category deleted")
      setDeleteOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: category.color ?? "#64748b" }}
        />
        <span className="text-sm">{category.name}</span>
      </div>
      {!category.isSystem && (
        <div className="flex gap-1">
          <CategoryFormDialog
            category={category}
            trigger={
              <Button variant="ghost" size="icon-xs">
                <span className="sr-only">Edit {category.name}</span>
                <Pencil className="size-3.5" />
              </Button>
            }
          />
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon-xs">
                  <span className="sr-only">Delete {category.name}</span>
                  <Trash2 className="size-3.5" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this category?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{category.name}&quot; will be removed. Past transactions
                  using it will show as uncategorized rather than being deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const expenseCategories = categories.filter((c) => c.type === "expense")
  const incomeCategories = categories.filter((c) => c.type === "income")

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CategoryFormDialog
          trigger={
            <Button size="sm" variant="outline">
              <Plus /> New category
            </Button>
          }
        />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">
          Expense
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {expenseCategories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">Income</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {incomeCategories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </div>
      </div>
    </div>
  )
}
