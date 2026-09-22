import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type NewsFeedItem = {
  id: string
  headline: string
  summary: string
  source: string
  publishedAt: string | Date
  security?: { ticker: string } | null
  sector?: string | null
}

export function NewsFeed({ items }: { items: NewsFeedItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        No relevant news yet — hold or watch a security to see updates here.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-medium">
                {item.headline}
              </CardTitle>
              <Badge variant="outline" className="shrink-0">
                Sample data
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{item.summary}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              {item.source}
              {item.security ? ` · ${item.security.ticker}` : ""}
              {item.sector ? ` · ${item.sector}` : ""} ·{" "}
              {new Date(item.publishedAt).toLocaleDateString("en-NG", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
