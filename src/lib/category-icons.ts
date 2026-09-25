import {
  Banknote,
  Briefcase,
  Car,
  Church,
  Clapperboard,
  CreditCard,
  Gift,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Laptop,
  type LucideIcon,
  MoreHorizontal,
  Percent,
  PlusCircle,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react"

/** Kebab-case icon names as stored in `categories.icon` (see
 * seed-data/categories.ts) -> the Lucide component to render. Explicit map
 * rather than a dynamic kebab->Pascal lookup, since only a fixed, known set
 * of names is ever written to that column today.
 *
 * Exported as a plain object (not wrapped in a lookup function) so callers
 * index it directly — `CATEGORY_ICONS[x] ?? Tag` — rather than calling a
 * function that returns a component, which the React Compiler's
 * static-components rule flags as "creating a component during render". */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  banknote: Banknote,
  laptop: Laptop,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  percent: Percent,
  gift: Gift,
  "plus-circle": PlusCircle,
  utensils: Utensils,
  car: Car,
  home: Home,
  zap: Zap,
  clapperboard: Clapperboard,
  "shopping-bag": ShoppingBag,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  "hand-heart": HandHeart,
  church: Church,
  "credit-card": CreditCard,
  "more-horizontal": MoreHorizontal,
}

/** Fallback for custom user categories (no icon picker yet, so `icon` is
 * null) or any unrecognized value. */
export const FALLBACK_CATEGORY_ICON: LucideIcon = Tag
