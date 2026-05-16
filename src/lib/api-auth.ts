/**
 * API route helpers — get the current session and assert permissions.
 * Returns NextResponse with the appropriate error if the session/permission fails.
 */
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { auth, type SessionUser } from './auth'
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

export async function requireSession(): Promise<SessionUser> {
  const session = await auth()
  if (!session?.user) {
    throw new ApiError(401, 'Not authenticated')
  }
  return session.user as SessionUser
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
