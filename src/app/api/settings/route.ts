import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission } from '@/lib/api-auth'
import { settingsSchema } from '@/lib/validators'
import { audit, clientIp } from '@/lib/audit'

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
    const actor = await requirePermission('SETTINGS_MANAGE')
    const body = await req.json()
    const data = settingsSchema.parse(body)
    // Treat empty optional strings as null in DB.
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]),
    )
    const s = await prisma.companySettings.update({ where: { id: 'singleton' }, data: cleaned })
    await audit({
      actor: { id: actor.id, email: actor.email },
      action: 'settings.update',
      entityType: 'CompanySettings',
      entityId: 'singleton',
      ip: clientIp(req),
      // Don't dump the full logoUrl (can be a 35 KB data URL) — just the keys
      // that changed and a flag for whether the logo changed.
      metadata: {
        fields: Object.keys(cleaned).filter((k) => k !== 'logoUrl'),
        logoChanged: 'logoUrl' in cleaned,
      },
    })
    return NextResponse.json(s)
  } catch (e) {
    return apiError(e)
  }
}
