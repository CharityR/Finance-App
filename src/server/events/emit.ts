/**
 * Domain event bus stub. Phase 1-5 services call `emitEvent` at the moment
 * something notification-worthy happens (e.g. a budget category goes over
 * limit) so the call sites never change once Phase 6 adds a real
 * `notifications` table, delivery preferences, and push/email fan-out.
 *
 * For now this only records the event via the audit log — there is no
 * delivery, no in-app notification center yet.
 */
import { writeAudit } from "@/server/audit/log"

export type DomainEventType =
  | "budget.exceeded"
  | "goal.contribution_logged"
  | "goal.off_track"

export async function emitEvent(
  type: DomainEventType,
  payload: { userId: string; entityId?: string } & Record<string, unknown>
) {
  const { userId, entityId, ...metadata } = payload
  await writeAudit({
    userId,
    action: type,
    entity: "domain_event",
    entityId,
    metadata,
  })
}
