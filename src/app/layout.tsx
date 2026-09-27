import type { Metadata } from "next"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { DEFAULT_THEME_PALETTE } from "@/lib/theme-palettes"
import { withTimeout } from "@/lib/with-timeout"
import { getProfile } from "@/server/repositories/profiles.repository"
import { getCurrentUser } from "@/server/supabase/server"

export const metadata: Metadata = {
  title: "Kovault Financial",
  description: "Your financial command center",
}

// This lookup is purely a personalization nicety (which theme palette to
// paint <html data-theme> before first render) — every page in the app,
// including the public marketing page, renders inside this layout, so it
// must never let a slow/unreachable auth backend block the entire app.
// 2s is generous for a healthy request; on a timeout this just falls back
// to the default palette, it does NOT grant access to anything — the real,
// security-relevant auth check lives in (dashboard)/layout.tsx and is
// untouched by this.
const THEME_LOOKUP_TIMEOUT_MS = 2000

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await withTimeout(getCurrentUser(), THEME_LOOKUP_TIMEOUT_MS, null)
  const profile = user
    ? await withTimeout(getProfile(user.id), THEME_LOOKUP_TIMEOUT_MS, null)
    : null
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
