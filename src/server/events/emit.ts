/**
 * Domain event bus. Phase 1-5 services call `emitEvent` at the moment
 * something notification-worthy happens (e.g. a budget category goes over
 * limit) so call sites never change as delivery grows — this always writes
 * the audit trail, and additionally creates an in-app notification when the
 * user's preference for that event type is enabled. Email/push fan-out is
 * not wired up yet (needs a real provider — see notifications.repository.ts).
 */
import { formatMoney } from "@/lib/money"
import { writeAudit } from "@/server/audit/log"
import * as notificationsRepo from "@/server/repositories/notifications.repository"
import type { NotificationType } from "@/server/repositories/notifications.repository"

export type DomainEventType =
  | "budget.exceeded"
  | "goal.contribution_logged"
  | "goal.off_track"
  | "category.spending_trend"
  | "transaction.unusual_amount"

type EventPayload = { userId: string; entityId?: string } & Record<
  string,
  unknown
>

const NOTIFICATION_TYPE: Record<DomainEventType, NotificationType> = {
  "budget.exceeded": "budget_exceeded",
  "goal.off_track": "goal_off_track",
  "goal.contribution_logged": "goal_contribution_logged",
  "category.spending_trend": "category_spending_trend",
  "transaction.unusual_amount": "unusual_transaction",
}

const PREFERENCE_KEY: Record<
  DomainEventType,
  keyof typeof notificationsRepo.DEFAULT_PREFERENCES
> = {
  "budget.exceeded": "budgetExceeded",
  "goal.off_track": "goalOffTrack",
  "goal.contribution_logged": "goalContributionLogged",
  "category.spending_trend": "categorySpendingTrend",
  "transaction.unusual_amount": "unusualTransaction",
}

function buildNotificationContent(
  type: DomainEventType,
  payload: EventPayload
): { title: string; body: string } | null {
  switch (type) {
    case "budget.exceeded": {
      const { categoryName, spent, limitAmount, currency } =
        payload as unknown as {
          categoryName: string
          spent: number
          limitAmount: number
          currency: string
        }
      return {
        title: "Budget exceeded",
        body: `You've spent ${formatMoney(spent, currency)} of your ${formatMoney(
          limitAmount,
          currency
        )} limit for ${categoryName} this month.`,
      }
    }
    case "goal.off_track": {
      const { goalName } = payload as unknown as { goalName: string }
      return {
        title: "Goal falling behind",
        body: `"${goalName}" is projected to finish after its target date at your current contribution pace.`,
      }
    }
    case "goal.contribution_logged": {
      const { goalName, amount, currency } = payload as unknown as {
        goalName: string
        amount: number
        currency: string
      }
      return {
        title: "Contribution logged",
        body: `You added ${formatMoney(amount, currency)} to "${goalName}".`,
      }
    }
    case "category.spending_trend": {
      const { categoryName, percentAbove, currency, current } =
        payload as unknown as {
          categoryName: string
          percentAbove: number
          currency: string
          current: number
        }
      return {
        title: "Spending trend",
        body: `You've spent ${formatMoney(current, currency)} on ${categoryName} this month — ${Math.round(percentAbove)}% above your recent average.`,
      }
    }
    case "transaction.unusual_amount": {
      const { categoryName, amount, currency, multiple } =
        payload as unknown as {
          categoryName: string
          amount: number
          currency: string
          multiple: number
        }
      return {
        title: "Unusual transaction",
        body: `${formatMoney(amount, currency)} in ${categoryName} is about ${multiple.toFixed(1)}x your typical spend in that category.`,
      }
    }
  }
}

export async function emitEvent(type: DomainEventType, payload: EventPayload) {
  const { userId, entityId, ...metadata } = payload
  await writeAudit({
    userId,
    action: type,
    entity: "domain_event",
    entityId,
    metadata,
  })

  const preferences = await notificationsRepo.getPreferences(userId)
  const enabled = preferences[PREFERENCE_KEY[type]]
  if (!enabled) return

  const content = buildNotificationContent(type, payload)
  if (!content) return

  await notificationsRepo.createNotification({
    userId,
    type: NOTIFICATION_TYPE[type],
    entityId,
    ...content,
  })
}
