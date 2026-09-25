"use client"

import * as React from "react"
import { useState } from "react"

import { Input } from "@/components/ui/input"

function formatForDisplay(raw: string): string {
  if (raw === "" || Number.isNaN(Number(raw))) return raw
  const [whole, fraction] = raw.split(".")
  const formattedWhole = new Intl.NumberFormat("en-NG").format(
    Number(whole || 0)
  )
  return fraction !== undefined
    ? `${formattedWhole}.${fraction}`
    : formattedWhole
}

/**
 * A number field that shows thousand separators — native
 * `<input type="number">` can't (typing "1,465,101" into one is either
 * rejected or silently stripped by the browser), which is why raw values
 * like "1465101" were leaking into the UI. Shows the raw digits while
 * focused (so typing/backspacing behaves predictably — reformatting on
 * every keystroke would fight the cursor) and comma-formatted once you
 * click away. The value passed to `onChange`/`value` is always the plain
 * numeric string, same contract as before — only the display changes.
 */
export function MoneyInput({
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}: {
  value: string
  onChange: (value: string) => void
} & Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode"
>) {
  const [focused, setFocused] = useState(false)

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={focused ? value : formatForDisplay(value)}
      onFocus={(e) => {
        setFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        onBlur?.(e)
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/,/g, "")
        if (raw === "" || /^\d*\.?\d*$/.test(raw)) onChange(raw)
      }}
      {...props}
    />
  )
}
