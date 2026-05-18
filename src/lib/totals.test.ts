import { describe, it, expect } from 'vitest'
import { calcTotals } from './totals'

describe('calcTotals', () => {
  it('sums line items with no tax, no discount', () => {
    expect(calcTotals([{ qty: 2, unitPrice: 100 }], 0, 0)).toEqual({
      subtotal: 200,
      discountAmt: 0,
      taxAmount: 0,
      total: 200,
    })
  })

  it('applies 15% VAT after no discount', () => {
    expect(calcTotals([{ qty: 1, unitPrice: 1000 }], 15, 0)).toEqual({
      subtotal: 1000,
      discountAmt: 0,
      taxAmount: 150,
      total: 1150,
    })
  })

  it('applies discount BEFORE tax (tax on discounted amount)', () => {
    // 1000 * 10% discount = 100 off; (1000-100) * 15% = 135 tax; total = 1035
    expect(calcTotals([{ qty: 1, unitPrice: 1000 }], 15, 10)).toEqual({
      subtotal: 1000,
      discountAmt: 100,
      taxAmount: 135,
      total: 1035,
    })
  })

  it('handles string inputs (form fields are strings)', () => {
    expect(calcTotals([{ qty: '2', unitPrice: '49.99' }], '15', '0')).toMatchObject({
      subtotal: 99.98,
      taxAmount: 15,
      total: 114.98,
    })
  })

  it('rounds to 2 decimal places (no float drift)', () => {
    const t = calcTotals([{ qty: 3, unitPrice: 0.1 }], 0, 0)
    expect(t.subtotal).toBe(0.3)
    expect(t.total).toBe(0.3)
  })

  it('sums multiple lines', () => {
    expect(
      calcTotals(
        [
          { qty: 2, unitPrice: 100 }, // 200
          { qty: 1, unitPrice: 50 },  //  50
        ],
        0,
        0,
      ).subtotal,
    ).toBe(250)
  })

  it('treats invalid numbers as 0 (does not throw)', () => {
    expect(calcTotals([{ qty: 'abc', unitPrice: 'xyz' }], 0, 0).total).toBe(0)
  })

  it('uses defaults when tax/discount omitted', () => {
    expect(calcTotals([{ qty: 1, unitPrice: 1000 }])).toMatchObject({
      // defaults: taxRate=15, discount=0
      taxAmount: 150,
      total: 1150,
    })
  })

  it('100% discount → zero total', () => {
    expect(calcTotals([{ qty: 1, unitPrice: 100 }], 15, 100)).toEqual({
      subtotal: 100,
      discountAmt: 100,
      taxAmount: 0,
      total: 0,
    })
  })
})
