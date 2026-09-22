import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const accountTypeEnum = pgEnum("account_type", [
  "cash",
  "bank",
  "mobile_money",
  "investment",
  "other",
])

export const categoryTypeEnum = pgEnum("category_type", ["income", "expense"])

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer",
])

/**
 * Structural implementation of the data-provenance principle: every
 * monetary/derived value in the API is tagged with one of these so the UI
 * can render an Actual / Current / Estimated / Projected / AI-interpretation
 * badge instead of presenting all numbers as equally authoritative.
 */
export const provenanceEnum = pgEnum("provenance", [
  "actual",
  "current",
  "estimated",
  "projected",
  "ai_interpretation",
])

export const transactionSourceEnum = pgEnum("transaction_source", [
  "manual",
  "import",
  "bank_sync",
])

// ---------------------------------------------------------------------------
// Module 1 — User & Account Management
// ---------------------------------------------------------------------------

/**
 * Mirrors auth.users (Supabase Auth). `id` is not a Postgres foreign key
 * because auth.users lives in a schema Supabase manages; it is kept in sync
 * via the handle_new_user() trigger (see supabase/migrations) rather than a
 * declared relation.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  baseCurrency: text("base_currency").notNull().default("NGN"),
  themePalette: text("theme_palette").notNull().default("teal"),
  timezone: text("timezone").notNull().default("Africa/Lagos"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull().default("cash"),
    currency: text("currency").notNull().default("NGN"),
    openingBalance: numeric("opening_balance", { precision: 19, scale: 4 })
      .notNull()
      .default("0"),
    isMock: boolean("is_mock").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)]
)

// ---------------------------------------------------------------------------
// Module 2/3 — Cash Flow & Budgeting
// ---------------------------------------------------------------------------

/**
 * `userId` is null for shared system-default categories (seeded once,
 * visible to every user); non-null rows are a user's own custom categories.
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    name: text("name").notNull(),
    type: categoryTypeEnum("type").notNull(),
    icon: text("icon"),
    color: text("color"),
    isSystem: boolean("is_system").notNull().default(false),
  },
  (table) => [index("categories_user_id_idx").on(table.userId)]
)

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
    currency: text("currency").notNull().default("NGN"),
    type: transactionTypeEnum("type").notNull(),
    description: text("description"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    provenance: provenanceEnum("provenance").notNull().default("actual"),
    source: transactionSourceEnum("source").notNull().default("manual"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("transactions_user_occurred_idx").on(table.userId, table.occurredAt),
    index("transactions_user_category_idx").on(table.userId, table.categoryId),
  ]
)

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    periodMonth: date("period_month").notNull(),
    currency: text("currency").notNull().default("NGN"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("budgets_user_period_idx").on(table.userId, table.periodMonth),
  ]
)

export const budgetCategories = pgTable(
  "budget_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    limitAmount: numeric("limit_amount", { precision: 19, scale: 4 }).notNull(),
  },
  (table) => [
    uniqueIndex("budget_categories_budget_category_idx").on(
      table.budgetId,
      table.categoryId
    ),
  ]
)

// ---------------------------------------------------------------------------
// Module 5 — Financial Goals (Phase 2)
// ---------------------------------------------------------------------------

export const goalCategoryEnum = pgEnum("goal_category", [
  "emergency_fund",
  "house",
  "car",
  "education",
  "travel",
  "retirement",
  "investment_target",
  "debt_repayment",
  "business_capital",
  "custom",
])

export const goalPriorityEnum = pgEnum("goal_priority", [
  "low",
  "medium",
  "high",
])

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "archived",
])

export const contributionFrequencyEnum = pgEnum("contribution_frequency", [
  "weekly",
  "monthly",
  "yearly",
])

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    category: goalCategoryEnum("category").notNull().default("custom"),
    targetAmount: numeric("target_amount", {
      precision: 19,
      scale: 4,
    }).notNull(),
    currentAmount: numeric("current_amount", { precision: 19, scale: 4 })
      .notNull()
      .default("0"),
    targetDate: date("target_date").notNull(),
    priority: goalPriorityEnum("priority").notNull().default("medium"),
    contributionFrequency: contributionFrequencyEnum("contribution_frequency")
      .notNull()
      .default("monthly"),
    contributionAmount: numeric("contribution_amount", {
      precision: 19,
      scale: 4,
    })
      .notNull()
      .default("0"),
    currency: text("currency").notNull().default("NGN"),
    status: goalStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("goals_user_id_idx").on(table.userId)]
)

export const goalContributions = pgTable(
  "goal_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    transactionId: uuid("transaction_id").references(() => transactions.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("goal_contributions_goal_id_idx").on(table.goalId)]
)

// ---------------------------------------------------------------------------
// Module 6/7/8 — Investment Portfolio, Asset Allocation, Dividends (Phase 3)
// ---------------------------------------------------------------------------

export const assetClassEnum = pgEnum("asset_class", [
  "stock",
  "etf",
  "mutual_fund",
  "bond",
  "treasury_bill",
  "reit",
  "gold",
  "other",
])

/** Shared reference data — not user-specific. Mock-seeded in Phase 3-5. */
export const securities = pgTable(
  "securities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticker: text("ticker").notNull(),
    name: text("name").notNull(),
    exchange: text("exchange").notNull(),
    assetClass: assetClassEnum("asset_class").notNull(),
    sector: text("sector"),
    country: text("country").notNull(),
    currency: text("currency").notNull(),
    isMock: boolean("is_mock").notNull().default(true),
  },
  (table) => [
    uniqueIndex("securities_ticker_exchange_idx").on(
      table.ticker,
      table.exchange
    ),
  ]
)

export const holdings = pgTable(
  "holdings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    securityId: uuid("security_id")
      .notNull()
      .references(() => securities.id, { onDelete: "cascade" }),
    quantity: numeric("quantity", { precision: 19, scale: 6 }).notNull(),
    averageCostBasis: numeric("average_cost_basis", {
      precision: 19,
      scale: 4,
    }).notNull(),
    currency: text("currency").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("holdings_user_id_idx").on(table.userId),
    uniqueIndex("holdings_user_security_idx").on(
      table.userId,
      table.securityId
    ),
  ]
)

/** Mock-generated (Phase 3-5) or real (Phase 6+) price history per security. */
export const priceSnapshots = pgTable(
  "price_snapshot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    securityId: uuid("security_id")
      .notNull()
      .references(() => securities.id, { onDelete: "cascade" }),
    price: numeric("price", { precision: 19, scale: 4 }).notNull(),
    currency: text("currency").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
    provenance: provenanceEnum("provenance").notNull().default("current"),
    isMock: boolean("is_mock").notNull().default(true),
  },
  (table) => [
    index("price_snapshot_security_fetched_idx").on(
      table.securityId,
      table.fetchedAt
    ),
  ]
)

export const dividendEvents = pgTable(
  "dividend_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    securityId: uuid("security_id")
      .notNull()
      .references(() => securities.id, { onDelete: "cascade" }),
    exDate: date("ex_date").notNull(),
    payDate: date("pay_date").notNull(),
    amountPerShare: numeric("amount_per_share", {
      precision: 19,
      scale: 4,
    }).notNull(),
    currency: text("currency").notNull(),
    isMock: boolean("is_mock").notNull().default(true),
  },
  (table) => [index("dividend_event_security_id_idx").on(table.securityId)]
)

// ---------------------------------------------------------------------------
// Module 12/14/28 — Company/Sector News & Watchlist (Phase 4)
// ---------------------------------------------------------------------------

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    securityId: uuid("security_id")
      .notNull()
      .references(() => securities.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("watchlist_items_user_id_idx").on(table.userId),
    uniqueIndex("watchlist_items_user_security_idx").on(
      table.userId,
      table.securityId
    ),
  ]
)

/**
 * Mock fixture news (Phase 4-5). A real Phase 6+ adapter would populate this
 * same table from a live news API, so calling code never changes.
 */
export const newsItems = pgTable(
  "news_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    securityId: uuid("security_id").references(() => securities.id, {
      onDelete: "cascade",
    }),
    sector: text("sector"),
    headline: text("headline").notNull(),
    summary: text("summary").notNull(),
    source: text("source").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    isMock: boolean("is_mock").notNull().default(true),
  },
  (table) => [
    index("news_item_security_id_idx").on(table.securityId),
    index("news_item_published_at_idx").on(table.publishedAt),
  ]
)

// ---------------------------------------------------------------------------
// Cross-cutting stubs — created now so later phases never need a destructive
// migration to introduce them; only additive columns/tables get layered on.
// ---------------------------------------------------------------------------

/**
 * Generic cache/audit trail for every external provider lookup (market
 * prices, dividends, news, FX, banking). Lets the mock adapters (Phase 0-5)
 * and real adapters (Phase 6+) share one storage shape, and keeps a record
 * of what was fetched, from where, and when — never presented as 'actual'.
 */
export const providerCache = pgTable(
  "provider_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    dataType: text("data_type").notNull(),
    externalId: text("external_id").notNull(),
    payload: jsonb("payload").notNull(),
    provenance: provenanceEnum("provenance").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("provider_cache_lookup_idx").on(
      table.provider,
      table.dataType,
      table.externalId
    ),
  ]
)

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_log_user_created_idx").on(table.userId, table.createdAt),
  ]
)

// ---------------------------------------------------------------------------
// Notifications (Phase 6) — emitEvent() (src/server/events/emit.ts) writes
// here in addition to the audit log whenever the user's preference for that
// event type is enabled, so the in-app notification center has something to
// show without every domain service needing to know about notifications
// directly.
// ---------------------------------------------------------------------------

export const notificationTypeEnum = pgEnum("notification_type", [
  "budget_exceeded",
  "goal_off_track",
  "goal_contribution_logged",
])

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    // Not a declared FK: the referenced entity's table varies by type
    // (a budget category, a goal), mirroring audit_log's entityId above.
    entityId: uuid("entity_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
  ]
)

/**
 * One row per user, created lazily on first save (see
 * notifications.repository.ts) rather than at signup — a missing row means
 * "use the defaults", which the repository applies in code.
 */
export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id").primaryKey(),
  budgetExceeded: boolean("budget_exceeded").notNull().default(true),
  goalOffTrack: boolean("goal_off_track").notNull().default(true),
  goalContributionLogged: boolean("goal_contribution_logged")
    .notNull()
    .default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------------------
// Relations (used by Drizzle's query API, e.g. db.query.transactions.findMany)
// ---------------------------------------------------------------------------

export const profilesRelations = relations(profiles, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
}))

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgetCategories: many(budgetCategories),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}))

export const budgetsRelations = relations(budgets, ({ many }) => ({
  budgetCategories: many(budgetCategories),
}))

export const budgetCategoriesRelations = relations(
  budgetCategories,
  ({ one }) => ({
    budget: one(budgets, {
      fields: [budgetCategories.budgetId],
      references: [budgets.id],
    }),
    category: one(categories, {
      fields: [budgetCategories.categoryId],
      references: [categories.id],
    }),
  })
)

export const goalsRelations = relations(goals, ({ many }) => ({
  contributions: many(goalContributions),
}))

export const goalContributionsRelations = relations(
  goalContributions,
  ({ one }) => ({
    goal: one(goals, {
      fields: [goalContributions.goalId],
      references: [goals.id],
    }),
  })
)

export const securitiesRelations = relations(securities, ({ many }) => ({
  holdings: many(holdings),
  priceSnapshots: many(priceSnapshots),
  dividendEvents: many(dividendEvents),
}))

export const holdingsRelations = relations(holdings, ({ one }) => ({
  security: one(securities, {
    fields: [holdings.securityId],
    references: [securities.id],
  }),
}))

export const priceSnapshotsRelations = relations(priceSnapshots, ({ one }) => ({
  security: one(securities, {
    fields: [priceSnapshots.securityId],
    references: [securities.id],
  }),
}))

export const dividendEventsRelations = relations(dividendEvents, ({ one }) => ({
  security: one(securities, {
    fields: [dividendEvents.securityId],
    references: [securities.id],
  }),
}))

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  security: one(securities, {
    fields: [watchlistItems.securityId],
    references: [securities.id],
  }),
}))

export const newsItemsRelations = relations(newsItems, ({ one }) => ({
  security: one(securities, {
    fields: [newsItems.securityId],
    references: [securities.id],
  }),
}))
