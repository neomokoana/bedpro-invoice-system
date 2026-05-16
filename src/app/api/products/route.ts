import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission } from '@/lib/api-auth'
import { productSchema } from '@/lib/validators'

export async function GET() {
  try {
    await requirePermission('PRODUCTS_MANAGE')
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(products)
  } catch (e) {
    return apiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission('PRODUCTS_MANAGE')
    const body = await req.json()
    const data = productSchema.parse(body)
    const p = await prisma.product.create({ data })
    return NextResponse.json(p, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
