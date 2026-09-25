"use client"

import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  resolveSecurityAction,
  searchSecuritiesAction,
} from "@/app/(dashboard)/securities/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type SelectedSecurity = {
  id: string
  ticker: string
  name: string
  currency: string
}

/**
 * Search-as-you-type across our DB *and* every live provider (not just the
 * ~15 seeded fixtures) — picking a live-only result (badged "Add") creates
 * its securities row on the spot via resolveSecurityAction, then behaves
 * exactly like picking an existing one. Shared by HoldingForm and
 * WatchlistForm rather than each hand-rolling its own search.
 */
export function SecuritySearchInput({
  value,
  onChange,
  placeholder = "Search by ticker or name",
}: {
  value: SelectedSecurity | null
  onChange: (security: SelectedSecurity | null) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<
    Awaited<ReturnType<typeof searchSecuritiesAction>>
  >([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setResults([])
        return
      }
      setIsSearching(true)
      try {
        setResults(await searchSecuritiesAction(query))
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  async function handleSelect(
    option: Awaited<ReturnType<typeof searchSecuritiesAction>>[number]
  ) {
    if (option.id) {
      onChange({
        id: option.id,
        ticker: option.ticker,
        name: option.name,
        currency: option.currency ?? "NGN",
      })
      setQuery("")
      setResults([])
      setIsOpen(false)
      return
    }

    setIsResolving(true)
    try {
      const result = await resolveSecurityAction(
        option.ticker,
        option.source as "finnhub" | "ngn_market"
      )
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      onChange({
        id: result.security.id,
        ticker: result.security.ticker,
        name: result.security.name,
        currency: result.security.currency,
      })
      setQuery("")
      setResults([])
      setIsOpen(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not add this security"
      )
    } finally {
      setIsResolving(false)
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
        <span>
          {value.ticker} — {value.name}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onChange(null)}
        >
          <span className="sr-only">Clear</span>
          <X className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
      />
      {isOpen && query.trim() && (
        <div className="bg-popover absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border shadow-md">
          {isSearching ? (
            <p className="text-muted-foreground p-3 text-sm">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground p-3 text-sm">
              No matches for &quot;{query}&quot;
            </p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.source}-${r.ticker}`}
                type="button"
                disabled={isResolving}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(r)}
                className="hover:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm disabled:opacity-50"
              >
                <span>
                  {r.ticker} — {r.name}
                </span>
                {r.id === null && (
                  <Badge variant="outline" className="shrink-0">
                    Add
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
