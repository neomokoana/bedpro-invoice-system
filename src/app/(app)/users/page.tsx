import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { UsersClient } from './users-client'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user || !can(session.user.role, 'USERS_MANAGE')) redirect('/dashboard')

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

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-extrabold mb-1">Users</h1>
      <p className="text-sm text-gray-500 mb-6">
        Add staff and managers. They&apos;ll receive a temporary password by email and be asked to set their own on first sign-in.
      </p>
      <UsersClient
        currentUserId={session.user.id}
        initial={users.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
