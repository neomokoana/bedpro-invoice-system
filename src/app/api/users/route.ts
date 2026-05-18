import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission, ApiError } from '@/lib/api-auth'
import { userInviteSchema } from '@/lib/validators'
import { generateTempPassword } from '@/lib/temp-password'
import { sendMail, inviteEmailHtml } from '@/lib/email'
import { audit, clientIp } from '@/lib/audit'

export async function GET() {
  try {
    await requirePermission('USERS_MANAGE')
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branch: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })
    return NextResponse.json(users)
  } catch (e) {
    return apiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission('USERS_MANAGE')
    const body = await req.json()
    const data = userInviteSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new ApiError(409, 'A user with that email already exists.')

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        branch: data.branch,
        passwordHash,
        mustChangePassword: true,
      },
      select: { id: true, email: true, name: true, role: true },
    })

    const loginUrl = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '') + '/login'
    const company = await prisma.companySettings.findUnique({
      where: { id: 'singleton' },
      select: { logoUrl: true },
    })
    const mail = await sendMail({
      to: user.email,
      subject: 'Your Bed Pro account is ready',
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
      action: 'user.invite',
      entityType: 'User',
      entityId: user.id,
      ip: clientIp(req),
      metadata: { email: user.email, role: user.role, emailed: mail.sent },
    })

    // If email failed, return tempPassword once so admin can share it manually.
    // Otherwise never return it — keep it out of logs/responses.
    return NextResponse.json(
      {
        id: user.id,
        emailed: mail.sent,
        tempPassword: mail.sent ? undefined : tempPassword,
      },
      { status: 201 },
    )
  } catch (e) {
    return apiError(e)
  }
}
