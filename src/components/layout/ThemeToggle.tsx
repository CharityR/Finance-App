"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useHasMounted } from "@/hooks/use-has-mounted"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const hasMounted = useHasMounted()

  if (!hasMounted) {
    return <Button variant="ghost" size="icon-sm" className="invisible" />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
