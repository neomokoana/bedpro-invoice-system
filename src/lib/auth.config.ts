/**
 * Edge-safe Auth.js config — no DB, no bcrypt, no Node-only imports.
 * Used by middleware.ts which runs on the Edge runtime.
 *
 * The full config (with the credentials provider that hits the DB) lives in
 * auth.ts and extends this one.
 */
import type { NextAuthConfig } from 'next-auth'
import { canAccessPath } from './permissions'
import type { Role } from '@prisma/client'

export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    /**
     * The single source of truth for whether a request is allowed.
     * Returns:
     *   - true  → allow
     *   - false → redirect to /login (NextAuth's default for that signIn page)
     *   - NextResponse → custom redirect (we use this for role gates and the
     *                     first-login set-password flow)
     */
    authorized({ auth, request }) {
      const { nextUrl } = request
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      // /api/* is excluded from the middleware matcher entirely — so we only
      // see page requests here.

      // /login: public when signed out, redirect home when signed in.
      if (pathname === '/login') {
        if (isLoggedIn) {
          const target = auth!.user!.mustChangePassword ? '/set-password' : '/dashboard'
          return Response.redirect(new URL(target, nextUrl))
        }
        return true
      }

      if (!isLoggedIn) return false // → /login (pages.signIn)

      // First-login forced password change.
      if (auth!.user!.mustChangePassword && !pathname.startsWith('/set-password')) {
        return Response.redirect(new URL('/set-password', nextUrl))
      }
      if (!auth!.user!.mustChangePassword && pathname.startsWith('/set-password')) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }

      // Role gate.
      if (!canAccessPath(auth!.user!.role as Role, pathname)) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: Role }).role
        token.branch = (user as { branch: string | null }).branch ?? null
        token.mustChangePassword = (user as { mustChangePassword: boolean }).mustChangePassword
      }
      // Client-side update() can flip mustChangePassword off after the user sets one.
      if (trigger === 'update' && session?.mustChangePassword === false) {
        token.mustChangePassword = false
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.branch = (token.branch as string | null) ?? null
        session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false
      }
      return session
    },
  },
  providers: [], // populated in auth.ts (Node-only)
} satisfies NextAuthConfig
