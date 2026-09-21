import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Your financial command center.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 1</CardTitle>
          <CardDescription>
            Cash balance, income, expenses, and budget utilization will show up
            here once transactions and budgets are wired up.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
