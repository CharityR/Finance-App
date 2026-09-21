import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">WealthPilot</h1>
        <p className="text-muted-foreground max-w-md">
          Your financial command center — budgeting, goals, and investments in
          one place.
        </p>
      </div>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/signup" />}>
          Get started
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Log in
        </Button>
      </div>
    </div>
  )
}
