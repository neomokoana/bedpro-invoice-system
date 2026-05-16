import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission } from '@/lib/api-auth'
import { settingsSchema } from '@/lib/validators'

export async function GET() {
  try {
    await requirePermission('SETTINGS_MANAGE')
    const s = await prisma.companySettings.findUnique({ where: { id: 'singleton' } })
    return NextResponse.json(s)
  } catch (e) {
    return apiError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePermission('SETTINGS_MANAGE')
    const body = await req.json()
    const data = settingsSchema.parse(body)
    // Treat empty optional strings as null in DB.
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]),
    )
    const s = await prisma.companySettings.update({ where: { id: 'singleton' }, data: cleaned })
    return NextResponse.json(s)
  } catch (e) {
    return apiError(e)
  }
}
