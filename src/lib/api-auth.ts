/**
 * API route helpers — get the current session and assert permissions.
 * Returns NextResponse with the appropriate error if the session/permission fails.
 */
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { auth, type SessionUser } from './auth'
import { prisma } from './prisma'
import { can, type Permission } from './permissions'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Resolve the current session and re-validate the user against the DB.
 *
 * The JWT cookie alone is not sufficient — it lives for 30 days and survives
 * deactivation/role changes. Every authenticated API call therefore pays one
 * cheap `select` against `users` to confirm:
 *
 *   - the user still exists,
 *   - `isActive` is still true,
 *   - the *current* `role` (not the one cached in the JWT at sign-in).
 *
 * `allowMustChangePassword` is opt-in for endpoints that legitimately need
 * to serve a user who's mid-onboarding (`/api/account/password`). Every
 * other API rejects 401 so the client redirects to `/set-password`.
 */
export async function requireSession(
  opts: { allowMustChangePassword?: boolean } = {},
): Promise<SessionUser> {
  const session = await auth()
  if (!session?.user) {
    throw new ApiError(401, 'Not authenticated')
  }
  const fresh = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, role: true, branch: true, mustChangePassword: true },
  })
  if (!fresh || !fresh.isActive) {
    throw new ApiError(401, 'Account inactive')
  }
  if (fresh.mustChangePassword && !opts.allowMustChangePassword) {
    throw new ApiError(403, 'Password change required')
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: fresh.role, // freshest — admin may have promoted/demoted since sign-in
    branch: fresh.branch ?? null,
    mustChangePassword: fresh.mustChangePassword,
  }
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireSession()
  if (!can(user.role, permission)) {
    throw new ApiError(403, 'Forbidden')
  }
  return user
}

/**
 * Centralised error → response mapping. Every API route wraps its body in
 * `try { ... } catch (e) { return apiError(e) }` so handlers can throw freely.
 */
export function apiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', issues: err.flatten().fieldErrors },
      { status: 400 },
    )
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'A record with that value already exists.' },
        { status: 409 },
      )
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Record not found.' }, { status: 404 })
    }
    if (err.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot complete — this record is referenced by others.' },
        { status: 409 },
      )
    }
  }
  console.error('[api]', err)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
