import { describe, it, expect } from 'vitest'
import { formatMoney, formatDate, addDaysStr, todayStr } from './format'

describe('formatMoney', () => {
  it('inserts thousands separators with R prefix and 2 decimals', () => {
    expect(formatMoney(1234567.89)).toBe('R 1,234,567.89')
  })
  it('handles zero', () => {
    expect(formatMoney(0)).toBe('R 0.00')
  })
  it('accepts strings', () => {
    expect(formatMoney('1500.5')).toBe('R 1,500.50')
  })
  it('returns 0.00 for nonsense input', () => {
    expect(formatMoney('not a number')).toBe('R 0.00')
    expect(formatMoney(null)).toBe('R 0.00')
    expect(formatMoney(undefined)).toBe('R 0.00')
  })
  it('accepts a custom currency prefix', () => {
    expect(formatMoney(100, '$')).toBe('$ 100.00')
  })
})

describe('formatDate', () => {
  it('formats ISO date as dd MMM yyyy (en-ZA)', () => {
    // 2026-05-15 → en-ZA -> "15 May 2026"
    expect(formatDate('2026-05-15')).toMatch(/^15 May 2026$/)
  })
  it('returns empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
})

describe('todayStr / addDaysStr', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('addDaysStr(0) === todayStr()', () => {
    expect(addDaysStr(0)).toBe(todayStr())
  })
  it('addDaysStr(15) returns a date 15 days in the future', () => {
    const today = new Date(todayStr() + 'T00:00:00')
    const fifteen = new Date(addDaysStr(15) + 'T00:00:00')
    const diff = (fifteen.getTime() - today.getTime()) / 86_400_000
    expect(diff).toBe(15)
  })
})
