import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission } from '@/lib/api-auth'
import { customerSchema } from '@/lib/validators'

export async function GET() {
  try {
    await requirePermission('CUSTOMERS_MANAGE')
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(customers)
  } catch (e) {
    return apiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission('CUSTOMERS_MANAGE')
    const body = await req.json()
    const data = customerSchema.parse(body)
    const c = await prisma.customer.create({ data })
    return NextResponse.json(c, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
