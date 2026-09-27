import { Building2, PlusCircle, Wallet2 } from "lucide-react"
import { notFound, redirect } from "next/navigation"

import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { LiabilityForm } from "@/components/wealth/LiabilityForm"
import { LiabilityRow } from "@/components/wealth/LiabilityRow"
import { ManualAssetForm } from "@/components/wealth/ManualAssetForm"
import { ManualAssetRow } from "@/components/wealth/ManualAssetRow"
import * as liabilitiesService from "@/server/services/liabilities.service"
import * as manualAssetsService from "@/server/services/manual-assets.service"
import { getCurrentUser } from "@/server/supabase/server"

const CATEGORY_CONFIG = {
  "real-estate": {
    enum: "real_estate" as const,
    title: "Real Estate",
    description: "Properties you own, valued in their native currency.",
    icon: Building2,
  },
  "other-assets": {
    enum: "other" as const,
    title: "Other Assets",
    description: "Anything else you own that isn't cash or investments.",
    icon: Building2,
  },
}

export default async function WealthCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  if (category === "liabilities") {
    const liabilities = await liabilitiesService.listLiabilities(user.id)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Liabilities
            </h1>
            <p className="text-muted-foreground text-sm">
              Debt that&apos;s subtracted from your net worth.
            </p>
          </div>
          <LiabilityForm
            trigger={
              <Button>
                <PlusCircle /> Add liability
              </Button>
            }
          />
        </div>

        {liabilities.length === 0 ? (
          <EmptyState
            icon={Wallet2}
            title="No liabilities tracked"
            description="Add a mortgage, loan, or credit card balance to get an accurate net worth."
            action={
              <LiabilityForm
                trigger={
                  <Button>
                    <PlusCircle /> Add liability
                  </Button>
                }
              />
            }
          />
        ) : (
          <div className="divide-y rounded-lg border">
            {liabilities.map((liability) => (
              <LiabilityRow key={liability.id} liability={liability} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const config =
    CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]
  if (!config) notFound()

  const assets = await manualAssetsService.listManualAssets(
    user.id,
    config.enum
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {config.title}
          </h1>
          <p className="text-muted-foreground text-sm">{config.description}</p>
        </div>
        <ManualAssetForm
          category={config.enum}
          trigger={
            <Button>
              <PlusCircle /> Add {config.enum === "real_estate" ? "property" : "asset"}
            </Button>
          }
        />
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={config.icon}
          title={`No ${config.title.toLowerCase()} tracked`}
          description="Add one to include it in your net worth."
          action={
            <ManualAssetForm
              category={config.enum}
              trigger={
                <Button>
                  <PlusCircle /> Add {config.enum === "real_estate" ? "property" : "asset"}
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="divide-y rounded-lg border">
          {assets.map((asset) => (
            <ManualAssetRow key={asset.id} category={config.enum} asset={asset} />
          ))}
        </div>
      )}
    </div>
  )
}
