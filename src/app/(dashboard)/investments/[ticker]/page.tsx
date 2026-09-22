import { notFound, redirect } from "next/navigation"

import { NewsFeed } from "@/components/investments/NewsFeed"
import { PriceHistoryChart } from "@/components/investments/PriceHistoryChart"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import * as newsRepo from "@/server/repositories/news.repository"
import * as securitiesRepo from "@/server/repositories/securities.repository"
import { getCurrentUser } from "@/server/supabase/server"

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { ticker } = await params
  const security = await securitiesRepo.getSecurityByTicker(ticker)
  if (!security) notFound()

  const [priceHistory, dividendHistory, news] = await Promise.all([
    securitiesRepo.getPriceHistory(security.id, 10),
    securitiesRepo.getDividendHistory(security.id),
    newsRepo.getNewsForSecurity(security.id, security.sector),
  ])

  const latestPrice = priceHistory[0] ? Number(priceHistory[0].price) : null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {security.ticker}
          </h1>
          <Badge variant="outline">{security.exchange}</Badge>
          {security.isMock && <Badge variant="outline">Mock data</Badge>}
        </div>
        <p className="text-muted-foreground text-sm">{security.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Current price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {latestPrice !== null
                ? formatMoney(latestPrice, security.currency)
                : "—"}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Current</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {security.sector ?? "Unclassified"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{security.country}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price history</CardTitle>
          <CardDescription>Mock data — last 10 data points.</CardDescription>
        </CardHeader>
        <CardContent>
          <PriceHistoryChart
            history={priceHistory}
            currency={security.currency}
          />
        </CardContent>
      </Card>

      {dividendHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dividend history</CardTitle>
            <CardDescription>Mock data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dividendHistory.map((d) => {
              const isPast = new Date(d.payDate) < new Date()
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    Ex-date {new Date(d.exDate).toLocaleDateString("en-NG")} ·
                    Pay date {new Date(d.payDate).toLocaleDateString("en-NG")}
                  </span>
                  <span className="flex items-center gap-2 font-medium">
                    {formatMoney(Number(d.amountPerShare), d.currency)}/share
                    <Badge variant={isPast ? "outline" : "default"}>
                      {isPast ? "Paid" : "Upcoming"}
                    </Badge>
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          Related news
        </h2>
        <NewsFeed
          items={news.map((n) => ({ ...n, security: null, sector: n.sector }))}
        />
      </div>
    </div>
  )
}
