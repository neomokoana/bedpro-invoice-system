import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requireSession, ApiError } from '@/lib/api-auth'
import { can } from '@/lib/permissions'
import { audit, clientIp } from '@/lib/audit'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession()
    const { id } = await params
    const inv = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: true, receipts: true },
    })
    if (!inv) throw new ApiError(404, 'Not found')
    if (!can(user.role, 'INVOICES_VIEW_ALL') && inv.createdById !== user.id) {
      throw new ApiError(404, 'Not found')
    }
    return NextResponse.json(inv)
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession()
    if (!can(user.role, 'INVOICES_DELETE')) throw new ApiError(403, 'Forbidden')
    const { id } = await params
    const removed = await prisma.invoice.delete({
      where: { id },
      select: { id: true, number: true, total: true, customerId: true },
    })
    await audit({
      actor: { id: user.id, email: user.email },
      action: 'invoice.delete',
      entityType: 'Invoice',
      entityId: removed.id,
      ip: clientIp(req),
      metadata: {
        number: removed.number,
        total: removed.total.toString(),
        customerId: removed.customerId,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}
