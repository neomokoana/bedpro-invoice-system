/**
 * Role-based access rules.
 *
 *   ADMIN   — full access, manages users & settings
 *   MANAGER — all invoices/customers/products, no user management
 *   STAFF   — create invoices only (and view their own); no delete, no settings
 */
import type { Role } from '@prisma/client'

export const ROLE_RANK: Record<Role, number> = {
  ADMIN: 3,
  MANAGER: 2,
  STAFF: 1,
}

export function hasRole(actual: Role | undefined, required: Role): boolean {
  if (!actual) return false
  return ROLE_RANK[actual] >= ROLE_RANK[required]
}

/** Pages each role is allowed to load. Used by middleware. */
export const ROLE_ROUTES: Record<Role, RegExp[]> = {
  ADMIN: [/.*/],
  MANAGER: [
    /^\/dashboard/,
    /^\/invoices/,
    /^\/customers/,
    /^\/products/,
    /^\/account/,
    /^\/set-password/,
    // MANAGER cannot reach /settings or /users — those redirect to /dashboard.
  ],
  STAFF: [
    /^\/dashboard/,
    /^\/invoices(\/new)?$/,
    /^\/invoices\/[^/]+$/, // view one invoice
    /^\/customers$/,
    /^\/account/,
    /^\/set-password/,
  ],
}

export function canAccessPath(role: Role, pathname: string): boolean {
  return ROLE_ROUTES[role].some((re) => re.test(pathname))
}

/** API permission matrix. Used by route handlers. */
export const PERMISSIONS = {
  USERS_MANAGE: ['ADMIN'] as Role[],
  SETTINGS_MANAGE: ['ADMIN'] as Role[],
  PRODUCTS_MANAGE: ['ADMIN', 'MANAGER'] as Role[],
  CUSTOMERS_MANAGE: ['ADMIN', 'MANAGER', 'STAFF'] as Role[],
  INVOICES_CREATE: ['ADMIN', 'MANAGER', 'STAFF'] as Role[],
  INVOICES_UPDATE: ['ADMIN', 'MANAGER'] as Role[],
  INVOICES_DELETE: ['ADMIN'] as Role[],
  INVOICES_VIEW_ALL: ['ADMIN', 'MANAGER'] as Role[],
  INVOICES_MARK_PAID: ['ADMIN', 'MANAGER'] as Role[],
  INVOICES_SEND_EMAIL: ['ADMIN', 'MANAGER'] as Role[],
  RECEIPTS_VIEW: ['ADMIN', 'MANAGER'] as Role[],
} as const

export type Permission = keyof typeof PERMISSIONS

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  return (PERMISSIONS[permission] as readonly Role[]).includes(role)
}
