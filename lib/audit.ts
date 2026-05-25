'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AuditAction =
  | 'product.create'   | 'product.update'   | 'product.delete'
  | 'category.create'  | 'category.update'  | 'category.delete'
  | 'order.paid'       | 'order.status_change'
  | 'upload.file'

/**
 * Fire-and-forget audit log. Never throws — a logging failure must never
 * break the operation that triggered it.
 *
 * Pass `actor` explicitly for webhook/server contexts where there is no
 * user session (e.g. payment webhooks).
 */
export async function logAudit(
  action: AuditAction,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
  actor?: { id?: string; email?: string },
) {
  try {
    let actorId = actor?.id ?? null
    let actorEmail = actor?.email ?? null

    // If no explicit actor, pull from the current session cookie
    if (!actor) {
      const client = createClient()
      const { data: { user } } = await client.auth.getUser()
      actorId = user?.id ?? null
      actorEmail = user?.email ?? null
    }

    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      actor_id: actorId,
      actor_email: actorEmail,
      metadata: metadata ?? null,
    })
  } catch {
    // Intentionally silent — audit failures must never surface to users
  }
}
