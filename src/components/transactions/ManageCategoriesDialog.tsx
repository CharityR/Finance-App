"use client"

import { Tag } from "lucide-react"
import { useState } from "react"

import { CategoryManager } from "@/components/transactions/CategoryManager"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Category = {
  id: string
  name: string
  type: "income" | "expense"
  color: string | null
  isSystem: boolean
}

export function ManageCategoriesDialog({
  categories,
}: {
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Tag /> Manage categories
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
        </DialogHeader>
        <CategoryManager categories={categories} />
      </DialogContent>
    </Dialog>
  )
}
