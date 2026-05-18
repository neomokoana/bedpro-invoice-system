import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { computeStatus, daysUntilDue, STATUS_TRANSITIONS } from './status'

// Freeze "today" so the overdue boundary tests are deterministic.
const TODAY = new Date('2026-05-15T12:00:00Z')

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(TODAY)
})
afterAll(() => vi.useRealTimers())

const today = '2026-05-15'
const tomorrow = '2026-05-16'
const yesterday = '2026-05-14'

describe('computeStatus', () => {
  it('PAID short-circuits, regardless of dueDate', () => {
    expect(computeStatus({ status: 'PAID', dueDate: yesterday })).toBe('paid')
    expect(computeStatus({ status: 'PAID', dueDate: tomorrow })).toBe('paid')
  })

  it('DRAFT short-circuits, regardless of dueDate', () => {
    expect(computeStatus({ status: 'DRAFT', dueDate: yesterday })).toBe('draft')
    expect(computeStatus({ status: 'DRAFT', dueDate: tomorrow })).toBe('draft')
  })

  it('UNPAID + past dueDate → overdue', () => {
    expect(computeStatus({ status: 'UNPAID', dueDate: yesterday })).toBe('overdue')
  })

  it('SENT + past dueDate → overdue', () => {
    expect(computeStatus({ status: 'SENT', dueDate: yesterday })).toBe('overdue')
  })

  it('SENT + future dueDate → sent', () => {
    expect(computeStatus({ status: 'SENT', dueDate: tomorrow })).toBe('sent')
  })

  it('UNPAID + future dueDate → unpaid', () => {
    expect(computeStatus({ status: 'UNPAID', dueDate: tomorrow })).toBe('unpaid')
  })

  it('UNPAID + dueDate === today → unpaid (NOT overdue)', () => {
    // boundary: only past dates count as overdue
    expect(computeStatus({ status: 'UNPAID', dueDate: today })).toBe('unpaid')
  })
})

describe('daysUntilDue', () => {
  it('0 when due today', () => {
    expect(daysUntilDue(today)).toBe(0)
  })
  it('1 when due tomorrow', () => {
    expect(daysUntilDue(tomorrow)).toBe(1)
  })
  it('-1 when overdue by a day', () => {
    expect(daysUntilDue(yesterday)).toBe(-1)
  })
})

describe('STATUS_TRANSITIONS', () => {
  it('every display status has a transitions array', () => {
    for (const k of ['paid', 'unpaid', 'sent', 'draft', 'overdue'] as const) {
      expect(STATUS_TRANSITIONS[k]).toBeDefined()
    }
  })

  it('PAID can be undone', () => {
    expect(STATUS_TRANSITIONS.paid.some((t) => t.target === 'UNPAID')).toBe(true)
  })

  it('overdue can be marked paid', () => {
    expect(STATUS_TRANSITIONS.overdue.some((t) => t.target === 'PAID')).toBe(true)
  })
})
