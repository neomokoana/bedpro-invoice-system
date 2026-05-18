import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { apiError, requireSession, ApiError } from '@/lib/api-auth'
import { passwordChangeSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  try {
    // First-login users (mustChangePassword=true) must be allowed through here,
    // because changing the password is the whole point of this endpoint.
    const me = await requireSession({ allowMustChangePassword: true })
    const body = await req.json()
    const { currentPassword, newPassword } = passwordChangeSchema.parse(body)

    // Defence-in-depth: re-check complexity server-side.
    if (newPassword.length < 12)
      throw new ApiError(400, 'Password must be at least 12 characters.')
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw new ApiError(400, 'Use upper, lower and a number.')
    }
    if (newPassword === currentPassword)
      throw new ApiError(400, 'New password must differ from current.')

    const user = await prisma.user.findUnique({ where: { id: me.id } })
    if (!user) throw new ApiError(404, 'User not found')

    const ok = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!ok) throw new ApiError(400, 'Current password is incorrect.')

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return apiError(e)
  }
}
