import type { Metadata } from "next"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { DEFAULT_THEME_PALETTE } from "@/lib/theme-palettes"
import { getProfile } from "@/server/repositories/profiles.repository"
import { getCurrentUser } from "@/server/supabase/server"

export const metadata: Metadata = {
  title: "Kovault Financial",
  description: "Your financial command center",
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser()
  const profile = user ? await getProfile(user.id) : null
  const themePalette = profile?.themePalette ?? DEFAULT_THEME_PALETTE

  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme={themePalette}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
