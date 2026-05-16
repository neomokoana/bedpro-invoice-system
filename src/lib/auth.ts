/**
 * Auth.js v5 — full Node-side config. Extends auth.config.ts with the
 * credentials provider that hits Postgres and bcrypts the password.
 *
 *   - 30-day JWT cookie
 *   - bcrypt cost 12
 *   - blocks deactivated accounts (ACCOUNT_DISABLED)
 *   - 5-strike lockout for 15 minutes (ACCOUNT_LOCKED)
 *   - dummy bcrypt compare when the user doesn't exist, to defeat
 *     email-enumeration via response timing
 *   - role + branch carried in the token so the edge middleware can
 *     authorize without a DB round-trip
 */
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { Role } from '@prisma/client'
import { prisma } from './prisma'
import { authConfig } from './auth.config'

const LOCKOUT_MINUTES = 15
const MAX_FAILED_ATTEMPTS = 5

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1).max(200),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({ where: { email } })

        // Constant-time-ish: do a dummy bcrypt compare when the user is missing,
        // so timing doesn't leak which emails exist.
        if (!user) {
          await bcrypt.compare(password, '$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsa')
          return null
        }

        if (!user.isActive) throw new Error('ACCOUNT_DISABLED')
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('ACCOUNT_LOCKED')
        }

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) {
          const failed = user.failedLoginCount + 1
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: failed,
              lockedUntil:
                failed >= MAX_FAILED_ATTEMPTS
                  ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
                  : null,
            },
          })
          return null
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branch: user.branch ?? null,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],
})

export type SessionUser = {
  id: string
  email: string
  name: string
  role: Role
  branch: string | null
  mustChangePassword: boolean
}
