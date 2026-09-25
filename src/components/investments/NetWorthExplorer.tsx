"use client"

import { ChevronLeft } from "lucide-react"
import { useState } from "react"
import { ResponsiveContainer, Treemap } from "recharts"

import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tilt } from "@/components/ui/tilt"
import { TickerAvatar } from "@/components/ui/ticker-avatar"
import { formatMoney } from "@/lib/money"
import type {
  NetWorthBreakdown,
  NetWorthCountry,
} from "@/server/services/portfolio.service"

const COLORS = [
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#f97316",
  "#eab308",
  "#16a34a",
  "#64748b",
  "#0891b2",
  "#dc2626",
]

type TreemapCellProps = {
  x: number
  y: number
  width: number
  height: number
  name?: string
  percentage?: number
  index: number
  depth: number
}

function TreemapCell(props: TreemapCellProps) {
  const { x, y, width, height, name, percentage, index, depth } = props
  // Recharts also calls `content` once for the synthetic root node wrapping
  // the whole chart (depth 0) — it has no name/percentage of its own and
  // would otherwise paint a full-size rect behind the real cells.
  if (depth === 0 || width < 1 || height < 1) return null
  const color = COLORS[index % COLORS.length]
  const canLabel = width > 56 && height > 32

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="var(--card)"
        strokeWidth={2}
        rx={6}
        className="cursor-pointer"
      />
      {canLabel && (
        <>
          <text
            x={x + 10}
            y={y + 20}
            fill="#fff"
            fontSize={13}
            fontWeight={600}
          >
            {name}
          </text>
          <text x={x + 10} y={y + 36} fill="#fff" fontSize={11} opacity={0.85}>
            {(percentage ?? 0).toFixed(0)}%
          </text>
        </>
      )}
    </g>
  )
}

type View =
  | { level: "total" }
  | { level: "countries" }
  | { level: "detail"; country: NetWorthCountry }

export function NetWorthExplorer({
  breakdown,
}: {
  breakdown: NetWorthBreakdown[]
}) {
  const [currencyIndex, setCurrencyIndex] = useState(0)
  const [view, setView] = useState<View>({ level: "total" })
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  const currencyData = breakdown[currencyIndex]

  if (!currencyData || currencyData.countries.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No holdings yet — add one to see your net worth breakdown.
      </p>
    )
  }

  function goToCountries() {
    setSelectedSector(null)
    setView({ level: "countries" })
  }

  const countryTreemapData = currencyData.countries.map((c) => ({
    name: c.country,
    value: c.value,
    percentage: c.percentage,
  }))

  return (
    <div className="space-y-3">
      {breakdown.length > 1 && (
        <div className="flex gap-2">
          {breakdown.map((b, i) => (
            <Button
              key={b.currency}
              size="sm"
              variant={i === currencyIndex ? "default" : "outline"}
              onClick={() => {
                setCurrencyIndex(i)
                setView({ level: "total" })
                setSelectedSector(null)
              }}
            >
              {b.currency}
            </Button>
          ))}
        </div>
      )}

      {view.level === "total" && (
        <Tilt>
          <Card
            className="hover:bg-muted/40 cursor-pointer transition-colors"
            onClick={goToCountries}
          >
            <CardContent className="flex flex-col items-center gap-1 py-10 text-center">
              <p className="text-muted-foreground text-sm">
                Total portfolio value ({currencyData.currency})
              </p>
              <p className="text-4xl font-semibold">
                <AnimatedNumber
                  value={currencyData.totalValue}
                  kind="money"
                  currency={currencyData.currency}
                />
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                Click to see where it&apos;s invested by country
              </p>
            </CardContent>
          </Card>
        </Tilt>
      )}

      {view.level === "countries" && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => setView({ level: "total" })}
          >
            <ChevronLeft /> Net worth
          </Button>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={countryTreemapData}
                dataKey="value"
                nameKey="name"
                stroke="var(--card)"
                content={(props) => (
                  <TreemapCell {...(props as unknown as TreemapCellProps)} />
                )}
                onClick={(node) => {
                  const country = currencyData.countries.find(
                    (c) =>
                      c.country === (node as unknown as { name: string }).name
                  )
                  if (country) {
                    setSelectedSector(null)
                    setView({ level: "detail", country })
                  }
                }}
                isAnimationActive={false}
              />
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view.level === "detail" && (
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={goToCountries}
          >
            <ChevronLeft /> Countries
          </Button>
          <div>
            <p className="text-lg font-semibold">{view.country.country}</p>
            <p className="text-muted-foreground text-sm">
              {formatMoney(view.country.value, currencyData.currency)} ·{" "}
              {view.country.percentage.toFixed(1)}% of {currencyData.currency}{" "}
              holdings
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={view.country.sectors.map((s) => ({
                  name: s.sector,
                  value: s.value,
                  percentage: s.percentage,
                }))}
                dataKey="value"
                nameKey="name"
                stroke="var(--card)"
                content={(props) => (
                  <TreemapCell {...(props as unknown as TreemapCellProps)} />
                )}
                onClick={(node) => {
                  const name = (node as unknown as { name: string }).name
                  setSelectedSector((prev) => (prev === name ? null : name))
                }}
                isAnimationActive={false}
              />
            </ResponsiveContainer>
          </div>

          <div className="divide-y rounded-lg border">
            {view.country.sectors
              .filter((s) => !selectedSector || s.sector === selectedSector)
              .flatMap((s) => s.holdings)
              .map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <TickerAvatar ticker={h.ticker} size="sm" />
                    <div>
                      <p className="font-medium">{h.ticker}</p>
                      <p className="text-muted-foreground text-xs">{h.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatMoney(h.currentValue, currencyData.currency)}
                    </p>
                    <p
                      className={`text-xs ${h.gainLoss >= 0 ? "text-positive" : "text-negative"}`}
                    >
                      {h.gainLoss >= 0 ? "+" : ""}
                      {h.gainLossPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
          {selectedSector && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSector(null)}
            >
              Clear sector filter ({selectedSector})
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
