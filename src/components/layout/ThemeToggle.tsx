"use client"

import { Check, Cloud, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useHasMounted } from "@/hooks/use-has-mounted"
import { cn } from "@/lib/utils"

const MODES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "offwhite", label: "Off-white", icon: Cloud },
  { value: "dark", label: "Dark", icon: Moon },
] as const

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const hasMounted = useHasMounted()

  if (!hasMounted) {
    return <Button variant="ghost" size="icon-sm" className="invisible" />
  }

  const current = theme === "system" ? resolvedTheme : theme
  const CurrentIcon = MODES.find((m) => m.value === current)?.icon ?? Sun

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <span className="sr-only">Change appearance</span>
            <CurrentIcon className="size-4" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-40 p-1">
        {MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              "hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              current === value && "bg-muted font-medium"
            )}
          >
            <Icon className="size-4" />
            {label}
            {current === value && <Check className="ml-auto size-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
