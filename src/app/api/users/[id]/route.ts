import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission, ApiError } from '@/lib/api-auth'
import { audit, clientIp } from '@/lib/audit'

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
  branch: z.string().max(100).optional().nullable(),
  name: z.string().min(1).max(200).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requirePermission('USERS_MANAGE')
    const { id } = await params
    const body = await req.json()
    // Self-edits limited to name/branch to prevent admins locking themselves out.
    const data =
      id === me.id ? patchSchema.pick({ name: true, branch: true }).parse(body) : patchSchema.parse(body)
    const u = await prisma.user.update({ where: { id }, data, select: { id: true } })
    // `data.isActive` only exists when this is an admin editing another user;
    // self-edits run against the picked `{ name?, branch? }` schema.
    const isDeactivation = 'isActive' in data && data.isActive === false
    await audit({
      actor: { id: me.id, email: me.email },
      action: isDeactivation ? 'user.deactivate' : 'user.update',
      entityType: 'User',
      entityId: u.id,
      ip: clientIp(req),
      metadata: { changes: data },
    })
    return NextResponse.json(u)
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requirePermission('USERS_MANAGE')
    const { id } = await params
    if (id === me.id) throw new ApiError(400, 'You cannot delete yourself.')
    // Soft delete via deactivation. Hard delete would break FK on invoices/receipts.
    await prisma.user.update({ where: { id }, data: { isActive: false } })
    await audit({
      actor: { id: me.id, email: me.email },
      action: 'user.deactivate',
      entityType: 'User',
      entityId: id,
      ip: clientIp(req),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}
