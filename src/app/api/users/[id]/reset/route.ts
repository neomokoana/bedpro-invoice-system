import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission, ApiError } from '@/lib/api-auth'
import { generateTempPassword } from '@/lib/temp-password'
import { sendMail, inviteEmailHtml } from '@/lib/email'
import { audit, clientIp } from '@/lib/audit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requirePermission('USERS_MANAGE')
    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new ApiError(404, 'User not found')

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    })

    const loginUrl = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '') + '/login'
    const company = await prisma.companySettings.findUnique({
      where: { id: 'singleton' },
      select: { logoUrl: true },
    })
    const mail = await sendMail({
      to: user.email,
      subject: 'Your Bed Pro password has been reset',
      html: inviteEmailHtml({
        name: user.name,
        tempPassword,
        loginUrl,
        role: user.role,
        logoUrl: company?.logoUrl,
      }),
    })

    await audit({
      actor: { id: actor.id, email: actor.email },
      action: 'user.password_reset',
      entityType: 'User',
      entityId: user.id,
      ip: clientIp(req),
      metadata: { email: user.email, emailed: mail.sent },
    })

    return NextResponse.json({
      emailed: mail.sent,
      tempPassword: mail.sent ? undefined : tempPassword,
    })
  } catch (e) {
    return apiError(e)
  }
}
