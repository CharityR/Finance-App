/**
 * Curated theme palettes. Each one only changes the interactive accent
 * (buttons, links, focus rings, charts) — the brand mark itself always
 * renders in the fixed brand teal (see --brand in globals.css), regardless
 * of which palette is active. "teal" is the brand color used as a palette.
 */
export const THEME_PALETTES = [
  { id: "teal", label: "Teal", swatch: "#0d9488" },
  { id: "ocean", label: "Ocean Blue", swatch: "#2563eb" },
  { id: "indigo", label: "Indigo", swatch: "#4f46e5" },
  { id: "forest", label: "Forest Green", swatch: "#059669" },
  { id: "amber", label: "Amber Gold", swatch: "#b45309" },
  { id: "rose", label: "Rose", swatch: "#be123c" },
] as const

export type ThemePaletteId = (typeof THEME_PALETTES)[number]["id"]

export const THEME_PALETTE_IDS = THEME_PALETTES.map((p) => p.id) as [
  ThemePaletteId,
  ...ThemePaletteId[],
]

export const DEFAULT_THEME_PALETTE: ThemePaletteId = "teal"
