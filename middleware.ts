/**
 * Edge middleware — runs on every request matching the matcher below.
 *
 * Uses the Auth.js v5 edge-safe config (auth.config.ts) which contains zero
 * Node-only imports. The actual page/role decisions live in the `authorized`
 * callback in that file.
 */
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  // Match every page request EXCEPT:
  //   - /_next/*, favicon, public assets (static)
  //   - /api/* — API routes do their own auth via requireSession()
  //     and need to return JSON 401, not HTML redirects
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|logo.*).*)'],
}
