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
  (table) => [index("audit_log_user_created_idx").on(table.userId, table.createdAt)]
)

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
