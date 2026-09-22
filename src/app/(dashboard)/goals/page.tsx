import { redirect } from "next/navigation"

import { GoalCard } from "@/components/goals/GoalCard"
import { GoalForm } from "@/components/goals/GoalForm"
import { Button } from "@/components/ui/button"
import * as goalsService from "@/server/services/goals.service"
import { getCurrentUser } from "@/server/supabase/server"

export default async function GoalsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const goals = await goalsService.listGoalsWithProgress(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-muted-foreground text-sm">
            Track progress toward what you&apos;re saving and investing for.
          </p>
        </div>
        <GoalForm trigger={<Button>New goal</Button>} />
      </div>

      {goals.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No goals yet. Create one — an emergency fund, a house, anything
          you&apos;re saving toward.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  )
}
