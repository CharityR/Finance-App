"use client"

import { ExternalLink } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type NewsFeedItem = {
  id: string
  headline: string
  summary: string
  source: string
  publishedAt: string | Date
  security?: { ticker: string } | null
  sector?: string | null
  provenance?: "current" | "estimated"
  url?: string | null
}

function metaLine(item: NewsFeedItem) {
  return [
    item.source,
    item.security?.ticker,
    item.sector,
    new Date(item.publishedAt).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    }),
  ]
    .filter(Boolean)
    .join(" · ")
}

/**
 * Compact by default — headline + one-line summary preview, full text only
 * on demand. A live article (has a real `url`) opens the original source in
 * a new tab; a mock/estimated one has nothing to link to, so it expands
 * in-place in a dialog instead.
 */
export function NewsFeed({ items }: { items: NewsFeedItem[] }) {
  const [expanded, setExpanded] = useState<NewsFeedItem | null>(null)

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        No relevant news yet — hold or watch a security to see updates here.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {items.map((item) => {
          const body = (
            <>
              <CardHeader className="pb-1.5">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium">
                    {item.headline}
                  </CardTitle>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant="outline">
                      {item.provenance === "current" ? "Live" : "Sample data"}
                    </Badge>
                    {item.url && (
                      <ExternalLink className="text-muted-foreground size-3.5" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {item.summary}
                </p>
                <p className="text-muted-foreground mt-1.5 text-xs">
                  {metaLine(item)}
                </p>
              </CardContent>
            </>
          )

          return item.url ? (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card
                size="sm"
                className="hover:bg-muted/40 cursor-pointer transition-colors"
              >
                {body}
              </Card>
            </a>
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => setExpanded(item)}
              className="block w-full text-left"
            >
              <Card
                size="sm"
                className="hover:bg-muted/40 cursor-pointer transition-colors"
              >
                {body}
              </Card>
            </button>
          )
        })}
      </div>

      <Dialog
        open={expanded !== null}
        onOpenChange={(open) => !open && setExpanded(null)}
      >
        <DialogContent className="sm:max-w-md">
          {expanded && (
            <>
              <DialogHeader>
                <DialogTitle>{expanded.headline}</DialogTitle>
                <DialogDescription>{metaLine(expanded)}</DialogDescription>
              </DialogHeader>
              <p className="text-sm">{expanded.summary}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
