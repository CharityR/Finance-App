"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CategoryOption = { id: string; name: string; type: "income" | "expense" }

const TYPE_ITEMS = [
  { value: "all", label: "All types" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
]

const SORT_ITEMS = [
  { value: "occurredAt_desc", label: "Newest first" },
  { value: "occurredAt_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
]

export function TransactionFilters({
  categories,
}: {
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const categoryItems = [
    { value: "all", label: "All categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="Search description..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateParam("search", search || null)
        }}
        onBlur={() => updateParam("search", search || null)}
        className="max-w-56"
      />
      <Select
        items={TYPE_ITEMS}
        value={searchParams.get("type") ?? "all"}
        onValueChange={(value) =>
          updateParam("type", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={categoryItems}
        value={searchParams.get("categoryId") ?? "all"}
        onValueChange={(value) =>
          updateParam("categoryId", value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categoryItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={SORT_ITEMS}
        value={searchParams.get("sort") ?? "occurredAt_desc"}
        onValueChange={(value) => updateParam("sort", value)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORT_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
