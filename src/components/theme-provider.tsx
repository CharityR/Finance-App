"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/** Light/dark mode (a device preference), separate from the accent-palette
 * `data-theme` attribute the root layout sets server-side from the user's
 * saved profile — the two compose via globals.css's `.dark[data-theme=...]`
 * selectors. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
