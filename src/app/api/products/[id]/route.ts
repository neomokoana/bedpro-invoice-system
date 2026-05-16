import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission } from '@/lib/api-auth'
import { productSchema } from '@/lib/validators'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission('PRODUCTS_MANAGE')
    const { id } = await params
    const body = await req.json()
    const data = productSchema.partial().parse(body)
    const p = await prisma.product.update({ where: { id }, data })
    return NextResponse.json(p)
  } catch (e) {
    return apiError(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission('PRODUCTS_MANAGE')
    const { id } = await params
    await prisma.product.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}
