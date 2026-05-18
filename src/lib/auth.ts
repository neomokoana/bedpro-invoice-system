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
 *   - jwt callback re-syncs `mustChangePassword`, `role`, `branch` and
 *     `isActive` from the DB on `update()` so the client can never spoof
 *     them via `useSession().update({...})`
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

/**
 * Valid-format bcrypt-2a hash (60 chars, $2a$12$<22-char-salt><31-char-hash>)
 * pre-computed from `bcrypt.hashSync('do-not-use', 12)`. Compared against on
 * the missing-user path so timing is similar to a real lookup → defeats
 * email enumeration via response-time analysis.
 */
const DUMMY_HASH = '$2a$12$N6jH9rD0nN8rA5b1aTeP9ePqEkqp7nL.iVuYwG2vN9bN.j0bLO7Eu'

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1).max(200),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * jwt() runs on sign-in (with `user`), on session refresh, and when the
     * client calls `useSession().update(...)`. The DB-backed re-sync on the
     * `update` branch is the security boundary that stops a user from
     * spoofing `mustChangePassword: false` etc. via devtools.
     */
    async jwt({ token, user, trigger }) {
      // Initial sign-in.
      if (user) {
        token.id = user.id
        token.role = (user as { role: Role }).role
        token.branch = (user as { branch: string | null }).branch ?? null
        token.mustChangePassword = (user as { mustChangePassword: boolean }).mustChangePassword
        return token
      }
      // update() from client — NEVER trust the passed `session` here. Re-read
      // the authoritative fields from the DB and overwrite the token. If the
      // user has been deactivated, blank the token so any subsequent request
      // is treated as unauthenticated.
      if (trigger === 'update' && typeof token.id === 'string') {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            branch: true,
            mustChangePassword: true,
            isActive: true,
          },
        })
        if (!fresh || !fresh.isActive) {
          // Returning `null` from jwt() instructs Auth.js to invalidate the
          // session — the cookie's sub becomes unrecoverable.
          return null
        }
        token.role = fresh.role
        token.branch = fresh.branch ?? null
        token.mustChangePassword = fresh.mustChangePassword
      }
      return token
    },
  },
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
          await bcrypt.compare(password, DUMMY_HASH)
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
