import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission } from '@/lib/api-auth'
import { customerSchema } from '@/lib/validators'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission('CUSTOMERS_MANAGE')
    const { id } = await params
    const body = await req.json()
    const data = customerSchema.partial().parse(body)
    const c = await prisma.customer.update({ where: { id }, data })
    return NextResponse.json(c)
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission('CUSTOMERS_MANAGE')
    const { id } = await params
    // Soft delete — preserves history on invoices.
    await prisma.customer.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}
