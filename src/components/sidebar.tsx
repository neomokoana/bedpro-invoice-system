'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import type { Session } from 'next-auth'
import { BedProLogo } from './bedpro-logo'
import { cn } from '@/lib/cn'
import { can } from '@/lib/permissions'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  show: (role: Session['user']['role']) => boolean
  badge?: number
}

export function Sidebar({
  user,
  overdueCount,
  logoUrl,
}: {
  user: Session['user']
  overdueCount: number
  logoUrl?: string | null
}) {
  const pathname = usePathname()

  const items: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: () => true },
    {
      href: '/invoices',
      label: 'Invoices',
      icon: FileText,
      show: () => true,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    { href: '/customers', label: 'Customers', icon: Users, show: () => true },
    {
      href: '/products',
      label: 'Products',
      icon: Package,
      show: (r) => can(r, 'PRODUCTS_MANAGE'),
    },
    {
      href: '/users',
      label: 'Users',
      icon: UserCog,
      show: (r) => can(r, 'USERS_MANAGE'),
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      show: (r) => can(r, 'SETTINGS_MANAGE'),
    },
  ]

  return (
    <aside className="w-56 bg-[#111] text-white flex flex-col flex-shrink-0">
      <div className="px-5 pt-7 pb-4">
        <BedProLogo size={26} src={logoUrl} variant="light" />
        <div className="mt-1 text-[11px] text-gray-500 tracking-wider">INVOICE MANAGER</div>
      </div>
      <div className="border-t border-[#1a1a1a] mx-5 mb-2" />

      <nav className="flex-1 px-3 space-y-0.5">
        {items
          .filter((i) => i.show(user.role))
          .map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition',
                  active
                    ? 'bg-[#E8191A] text-white font-bold'
                    : 'text-gray-400 hover:bg-[#1c1c1c] hover:text-gray-200',
                )}
              >
                <Icon size={15} />
                <span className="flex-1">{item.label}</span>
                {item.badge != null && (
                  <span className="rounded-full bg-[#E8191A] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
      </nav>

      <div className="px-5 py-4 border-t border-[#1a1a1a]">
        <div className="text-[11px] text-gray-500">Bed Pro © {new Date().getFullYear()}</div>
        <div className="text-[10px] text-gray-600 mt-0.5">{user.branch ?? 'Pretoria, South Africa'}</div>
      </div>
    </aside>
  )
}
