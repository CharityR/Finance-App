import { LineChart, Target, Wallet2 } from "lucide-react"
import Link from "next/link"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const FEATURES = [
  {
    icon: Wallet2,
    title: "Budgeting",
    description:
      "Track every transaction and set category budgets that actually warn you before you overspend.",
  },
  {
    icon: Target,
    title: "Goals",
    description:
      "Emergency fund, a house, a car — set a target and see whether your pace will get you there on time.",
  },
  {
    icon: LineChart,
    title: "Investments",
    description:
      "Track your portfolio's value, allocation, and gain/loss in one place, with clear labels on what's real vs. estimated.",
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="from-primary/15 via-primary/5 relative overflow-hidden bg-gradient-to-b to-transparent">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
          <h1 className="text-brand text-4xl font-semibold tracking-tight sm:text-5xl">
            Kovault Financial
          </h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Your financial command center — budgeting, goals, and investments in
            one place.
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/signup" />}
            >
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Log in
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-16 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </div>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
