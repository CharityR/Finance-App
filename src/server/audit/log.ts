import { db, schema } from "@/server/db"

export async function writeAudit(entry: {
  userId?: string
  action: string
  entity: string
  entityId?: string
  metadata?: Record<string, unknown>
}) {
  await db.insert(schema.auditLog).values({
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    metadata: entry.metadata,
  })
}
