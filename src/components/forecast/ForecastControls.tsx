"use client"

import { useMemo, useState } from "react"

import { ScenarioChart } from "@/components/forecast/ScenarioChart"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/ui/money-input"
import { projectScenarios } from "@/lib/forecast"
import { formatMoney } from "@/lib/money"

const YEAR_OPTIONS = [3, 5, 10]

export function ForecastControls({
  initialValue,
  currency,
}: {
  initialValue: number
  currency: string
}) {
  const [currentValue, setCurrentValue] = useState(
    String(Math.round(initialValue))
  )
  const [monthlyContribution, setMonthlyContribution] = useState("0")
  const [years, setYears] = useState(10)

  const scenarios = useMemo(() => {
    const value = Number(currentValue) || 0
    const contribution = Number(monthlyContribution) || 0
    return projectScenarios(value, contribution, years)
  }, [currentValue, monthlyContribution, years])

  const finalPoint = (name: "conservative" | "base" | "optimistic") =>
    scenarios[name][scenarios[name].length - 1]?.value ?? 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Starting value ({currency})</Label>
          <MoneyInput value={currentValue} onChange={setCurrentValue} />
          <p className="text-muted-foreground text-xs">
            Pre-filled from your current portfolio value
          </p>
        </div>
        <div className="space-y-2">
          <Label>Monthly contribution ({currency})</Label>
          <MoneyInput
            placeholder="0"
            value={monthlyContribution}
            onChange={setMonthlyContribution}
          />
          <p className="text-muted-foreground text-xs">
            How much you plan to add each month — 0 projects growth alone
          </p>
        </div>
        <div className="space-y-2">
          <Label>Horizon</Label>
          <div className="flex gap-2">
            {YEAR_OPTIONS.map((y) => (
              <Button
                key={y}
                type="button"
                size="sm"
                variant={years === y ? "default" : "outline"}
                onClick={() => setYears(y)}
              >
                {y}y
              </Button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Years from today the chart projects forward
          </p>
        </div>
      </div>

      <ScenarioChart scenarios={scenarios} currency={currency} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="text-muted-foreground text-sm">
          Conservative:{" "}
          <span className="text-foreground font-medium">
            {formatMoney(finalPoint("conservative"), currency)}
          </span>
        </div>
        <div className="text-muted-foreground text-sm">
          Base:{" "}
          <span className="text-foreground font-medium">
            {formatMoney(finalPoint("base"), currency)}
          </span>
        </div>
        <div className="text-muted-foreground text-sm">
          Optimistic:{" "}
          <span className="text-foreground font-medium">
            {formatMoney(finalPoint("optimistic"), currency)}
          </span>
        </div>
      </div>
    </div>
  )
}
