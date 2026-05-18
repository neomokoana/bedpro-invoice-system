import { describe, it, expect } from 'vitest'
import { can, canAccessPath, hasRole } from './permissions'

describe('hasRole / RBAC ranking', () => {
  it('ADMIN >= every role', () => {
    expect(hasRole('ADMIN', 'STAFF')).toBe(true)
    expect(hasRole('ADMIN', 'MANAGER')).toBe(true)
    expect(hasRole('ADMIN', 'ADMIN')).toBe(true)
  })
  it('STAFF cannot do MANAGER work', () => {
    expect(hasRole('STAFF', 'MANAGER')).toBe(false)
  })
  it('undefined role → false', () => {
    expect(hasRole(undefined, 'STAFF')).toBe(false)
  })
})

describe('can (permission matrix)', () => {
  it('only ADMIN manages users', () => {
    expect(can('ADMIN', 'USERS_MANAGE')).toBe(true)
    expect(can('MANAGER', 'USERS_MANAGE')).toBe(false)
    expect(can('STAFF', 'USERS_MANAGE')).toBe(false)
  })
  it('only ADMIN deletes invoices', () => {
    expect(can('ADMIN', 'INVOICES_DELETE')).toBe(true)
    expect(can('MANAGER', 'INVOICES_DELETE')).toBe(false)
    expect(can('STAFF', 'INVOICES_DELETE')).toBe(false)
  })
  it('STAFF can create invoices but not view-all', () => {
    expect(can('STAFF', 'INVOICES_CREATE')).toBe(true)
    expect(can('STAFF', 'INVOICES_VIEW_ALL')).toBe(false)
  })
  it('MANAGER + ADMIN can mark paid', () => {
    expect(can('MANAGER', 'INVOICES_MARK_PAID')).toBe(true)
    expect(can('ADMIN', 'INVOICES_MARK_PAID')).toBe(true)
    expect(can('STAFF', 'INVOICES_MARK_PAID')).toBe(false)
  })
})

describe('canAccessPath (route gating)', () => {
  it('ADMIN can hit any path', () => {
    expect(canAccessPath('ADMIN', '/users')).toBe(true)
    expect(canAccessPath('ADMIN', '/settings')).toBe(true)
    expect(canAccessPath('ADMIN', '/dashboard')).toBe(true)
  })

  it('MANAGER cannot reach /users or /settings', () => {
    expect(canAccessPath('MANAGER', '/users')).toBe(false)
    expect(canAccessPath('MANAGER', '/settings')).toBe(false)
  })

  it('MANAGER can reach invoices/customers/products', () => {
    expect(canAccessPath('MANAGER', '/invoices')).toBe(true)
    expect(canAccessPath('MANAGER', '/customers')).toBe(true)
    expect(canAccessPath('MANAGER', '/products')).toBe(true)
  })

  it('STAFF cannot reach /products, /users, /settings', () => {
    expect(canAccessPath('STAFF', '/products')).toBe(false)
    expect(canAccessPath('STAFF', '/users')).toBe(false)
    expect(canAccessPath('STAFF', '/settings')).toBe(false)
  })

  it('STAFF can reach dashboard, customers, invoices list / new / one', () => {
    expect(canAccessPath('STAFF', '/dashboard')).toBe(true)
    expect(canAccessPath('STAFF', '/customers')).toBe(true)
    expect(canAccessPath('STAFF', '/invoices')).toBe(true)
    expect(canAccessPath('STAFF', '/invoices/new')).toBe(true)
    expect(canAccessPath('STAFF', '/invoices/clab123')).toBe(true)
  })

  it('every role can reach /set-password', () => {
    expect(canAccessPath('STAFF', '/set-password')).toBe(true)
    expect(canAccessPath('MANAGER', '/set-password')).toBe(true)
    expect(canAccessPath('ADMIN', '/set-password')).toBe(true)
  })
})
