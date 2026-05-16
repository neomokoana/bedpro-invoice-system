'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import type { Session } from 'next-auth'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  STAFF: 'Staff',
}

export function Header({ user }: { user: Session['user'] }) {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-bold">{user.name}</div>
          <div className="text-[11px] text-gray-500">
            {ROLE_LABEL[user.role] ?? user.role}
            {user.branch ? ` · ${user.branch}` : ''}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="bp-btn-ghost text-xs"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  )
}
