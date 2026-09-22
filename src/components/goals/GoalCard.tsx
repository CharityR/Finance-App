"use client"

import { Archive, Pencil, PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { archiveGoalAction } from "@/app/(dashboard)/goals/actions"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tilt } from "@/components/ui/tilt"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { ContributionDialog } from "@/components/goals/ContributionDialog"
import { GoalForm } from "@/components/goals/GoalForm"
import { formatMoney } from "@/lib/money"
import { GOAL_CATEGORY_LABELS } from "@/lib/validation/goals"
import type { GoalProgress } from "@/server/services/goals.service"

type Goal = {
  id: string
  name: string
  category: string
  targetAmount: string
  currentAmount: string
  targetDate: string | Date
  priority: string
  contributionFrequency: string
  contributionAmount: string
  currency: string
  status: string
  progress: GoalProgress
}

export function GoalCard({ goal }: { goal: Goal }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleArchive() {
    startTransition(async () => {
      try {
        await archiveGoalAction(goal.id)
        toast.success("Goal archived")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to archive")
      }
    })
  }

  const clamped = Math.min(goal.progress.percentage, 100)
  const isComplete = goal.status === "completed"

  return (
    <Tilt>
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{goal.name}</CardTitle>
            <p className="text-muted-foreground text-xs">
              {GOAL_CATEGORY_LABELS[
                goal.category as keyof typeof GOAL_CATEGORY_LABELS
              ] ?? goal.category}
            </p>
          </div>
          {isComplete ? (
            <Badge>Completed</Badge>
          ) : goal.progress.isOnTrack ? (
            <Badge variant="outline">On track</Badge>
          ) : (
            <Badge variant="destructive">Off track</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>
              <AnimatedNumber
                value={Number(goal.currentAmount)}
                kind="money"
                currency={goal.currency}
              />
            </span>
            <span>
              <AnimatedNumber
                value={Number(goal.targetAmount)}
                kind="money"
                currency={goal.currency}
              />
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${clamped}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            <AnimatedNumber
              value={goal.progress.percentage}
              kind="percent"
              decimals={0}
            />{" "}
            funded · target{" "}
            {new Date(goal.targetDate).toLocaleDateString("en-NG", {
              month: "short",
              year: "numeric",
            })}
          </p>
          {!isComplete && (
            <p className="text-muted-foreground text-xs">
              Needs{" "}
              {formatMoney(
                Math.max(goal.progress.requiredMonthlyContribution, 0),
                goal.currency
              )}
              /month to stay on track
              {goal.progress.projectedCompletionDate &&
                ` · projected ${new Date(
                  goal.progress.projectedCompletionDate
                ).toLocaleDateString("en-NG", {
                  month: "short",
                  year: "numeric",
                })}`}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {!isComplete && (
              <ContributionDialog
                goalId={goal.id}
                trigger={
                  <Button size="sm" variant="outline">
                    <PlusCircle /> Contribute
                  </Button>
                }
              />
            )}
            <GoalForm
              goal={goal}
              trigger={
                <Button size="sm" variant="ghost">
                  <Pencil /> Edit
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button size="sm" variant="ghost" disabled={isPending}>
                    <Archive /> Archive
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive this goal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{goal.name}&quot; will be hidden from your active
                    goals. This doesn&apos;t delete its contribution history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchive}>
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </Tilt>
  )
}
