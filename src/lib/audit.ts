/**
 * Audit logging. Records sensitive mutations to the audit_log table.
 *
 * Best-effort: a failure here is logged but doesn't fail the originating
 * request. The trade-off is that under DB hiccups we can lose a record,
 * not the user action. Worth it for invoicing — we'd rather mark an invoice
 * paid and lose its audit row than fail the payment-marking.
 *
 *   await audit({ actor, action: 'invoice.mark_paid', entityType: 'Invoice',
 *                 entityId: invoice.id, metadata: { method, reference } })
 */
import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { logger } from './logger'

type AuditActor = {
  id: string
  email: string
} | null

type AuditInput = {
  actor: AuditActor
  action: string
  entityType?: string
  entityId?: string
  ip?: string | null
  metadata?: Prisma.InputJsonValue
}

export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actor?.id ?? null,
        actorEmail: input.actor?.email ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        ip: input.ip ?? null,
        metadata: input.metadata,
      },
    })
  } catch (err) {
    logger.error('audit.write_failed', { action: input.action, entityId: input.entityId }, err)
  }
}

/** Best-effort extract of the client IP from a Next.js request. */
export function clientIp(req: Request): string | null {
  // Vercel sets x-forwarded-for; first hop is the originating client.
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? null
}
