import { eq, sql } from "drizzle-orm"

import { db, schema } from "@/server/db"

/**
 * Phase 1 doesn't expose account management UI yet — every user gets a
 * single implicit "Cash" account that transactions attach to. Multi-account
 * support (bank/mobile money/investment, real bank sync) is a later phase;
 * the schema already supports it, so this is additive, not a rewrite.
 */
export async function getOrCreateDefaultAccount(
  userId: string,
  currency: string
) {
  const existing = await db.query.accounts.findFirst({
    where: eq(schema.accounts.userId, userId),
  })
  if (existing) return existing

  const [created] = await db
    .insert(schema.accounts)
    .values({
      userId,
      name: "Cash",
      type: "cash",
      currency,
      isMock: true,
    })
    .returning()

  return created
}

export async function getTotalOpeningBalance(userId: string): Promise<number> {
  const [{ total }] = await db
    .select({
      total: sql<string>`coalesce(sum(${schema.accounts.openingBalance}), 0)`,
    })
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, userId))

  return Number(total)
}
