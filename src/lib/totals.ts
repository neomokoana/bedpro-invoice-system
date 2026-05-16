/**
 * Invoice maths. Single source of truth — also used on the server before
 * saving so the persisted totals match the form preview exactly.
 *
 * (Numbering — BP-#### / RCP-#### — is issued atomically via numbering.ts
 * using the CompanySettings counter inside the create transaction.)
 */
export type LineLike = { qty: number | string; unitPrice: number | string }

export type InvoiceTotals = {
  subtotal: number
  discountAmt: number
  taxAmount: number
  total: number
}

const n = (x: unknown): number => {
  const v = typeof x === 'string' ? parseFloat(x) : Number(x)
  return Number.isFinite(v) ? v : 0
}

export function calcTotals(
  lines: LineLike[],
  taxRate: number | string = 15,
  discount: number | string = 0,
): InvoiceTotals {
  const subtotal = lines.reduce((s, l) => s + n(l.qty) * n(l.unitPrice), 0)
  const discountAmt = subtotal * (n(discount) / 100)
  const afterDiscount = subtotal - discountAmt
  const taxAmount = afterDiscount * (n(taxRate) / 100)
  return {
    subtotal: round(subtotal),
    discountAmt: round(discountAmt),
    taxAmount: round(taxAmount),
    total: round(afterDiscount + taxAmount),
  }
}

function round(x: number) {
  return Math.round(x * 100) / 100
}
