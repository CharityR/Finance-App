"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  createGoalAction,
  updateGoalAction,
} from "@/app/(dashboard)/goals/actions"
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
import { GOAL_CATEGORY_LABELS } from "@/lib/validation/goals"

const CATEGORY_ITEMS = Object.entries(GOAL_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
)
const PRIORITY_ITEMS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]
const FREQUENCY_ITEMS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

const goalFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category: z.string().min(1),
  targetAmount: z
    .string()
    .min(1, "Target is required")
    .refine((v) => Number(v) > 0, "Target must be greater than zero"),
  targetDate: z.string().min(1, "Target date is required"),
  priority: z.string().min(1),
  contributionFrequency: z.string().min(1),
  contributionAmount: z.string(),
})
type GoalFormValues = z.infer<typeof goalFormSchema>

type EditableGoal = {
  id: string
  name: string
  category: string
  targetAmount: string
  targetDate: string | Date
  priority: string
  contributionFrequency: string
  contributionAmount: string
  currency: string
}

function toDefaults(goal?: EditableGoal): GoalFormValues {
  if (!goal) {
    return {
      name: "",
      category: "custom",
      targetAmount: "",
      targetDate: "",
      priority: "medium",
      contributionFrequency: "monthly",
      contributionAmount: "",
    }
  }
  return {
    name: goal.name,
    category: goal.category,
    targetAmount: String(Number(goal.targetAmount)),
    targetDate: new Date(goal.targetDate).toISOString().slice(0, 10),
    priority: goal.priority,
    contributionFrequency: goal.contributionFrequency,
    contributionAmount: String(Number(goal.contributionAmount)),
  }
}

export function GoalForm({
  goal,
  trigger,
}: {
  goal?: EditableGoal
  trigger: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isEditing = !!goal

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: toDefaults(goal),
  })

  async function onSubmit(values: GoalFormValues) {
    const payload = {
      name: values.name,
      category: values.category as never,
      targetAmount: Number(values.targetAmount),
      targetDate: new Date(values.targetDate),
      priority: values.priority as never,
      contributionFrequency: values.contributionFrequency as never,
      contributionAmount: Number(values.contributionAmount || 0),
      currency: "NGN",
    }

    try {
      if (isEditing) {
        await updateGoalAction(goal.id, payload)
        toast.success("Goal updated")
      } else {
        await createGoalAction(payload)
        toast.success("Goal created")
        form.reset(toDefaults())
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit goal" : "New goal"}</DialogTitle>
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
                    <Input placeholder="e.g. Emergency Fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    items={CATEGORY_ITEMS}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_ITEMS.map((item) => (
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
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target amount (NGN)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    items={PRIORITY_ITEMS}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_ITEMS.map((item) => (
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
              name="contributionFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution frequency</FormLabel>
                  <Select
                    items={FREQUENCY_ITEMS}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_ITEMS.map((item) => (
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
              name="contributionAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned contribution amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEditing ? "Save changes" : "Create goal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
