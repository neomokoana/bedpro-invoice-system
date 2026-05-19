import { describe, it, expect } from 'vitest'
import {
  customerSchema,
  productSchema,
  invoiceCreateSchema,
  passwordChangeSchema,
  settingsSchema,
} from './validators'

describe('customerSchema', () => {
  it('accepts minimal valid customer', () => {
    expect(() => customerSchema.parse({ name: 'Themba' })).not.toThrow()
  })
  it('rejects empty name', () => {
    expect(() => customerSchema.parse({ name: '' })).toThrow()
  })
  it('rejects invalid email', () => {
    expect(() => customerSchema.parse({ name: 'x', email: 'not-an-email' })).toThrow()
  })
  it('treats empty email as null', () => {
    const p = customerSchema.parse({ name: 'x', email: '' })
    expect(p.email).toBeNull()
  })
})

describe('productSchema', () => {
  it('rejects negative price', () => {
    expect(() => productSchema.parse({ name: 'X', unitPrice: -1 })).toThrow()
  })
  it('rejects non-finite price', () => {
    expect(() => productSchema.parse({ name: 'X', unitPrice: Infinity })).toThrow()
  })
})

describe('invoiceCreateSchema', () => {
  const goodBody = {
    customer: { name: 'A' },
    issueDate: '2026-05-15',
    dueDate: '2026-05-30',
    taxRate: 15,
    discount: 0,
    status: 'UNPAID',
    items: [{ productId: null, description: 'Bed', qty: 1, unitPrice: 1000 }],
  } as const

  it('accepts a valid body', () => {
    expect(() => invoiceCreateSchema.parse(goodBody)).not.toThrow()
  })

  it('rejects empty items array', () => {
    expect(() => invoiceCreateSchema.parse({ ...goodBody, items: [] })).toThrow()
  })

  it('rejects dueDate before issueDate', () => {
    expect(() =>
      invoiceCreateSchema.parse({ ...goodBody, issueDate: '2026-06-01', dueDate: '2026-05-30' }),
    ).toThrow()
  })

  it('accepts dueDate === issueDate', () => {
    expect(() =>
      invoiceCreateSchema.parse({ ...goodBody, issueDate: '2026-05-15', dueDate: '2026-05-15' }),
    ).not.toThrow()
  })

  it('rejects malformed date strings', () => {
    expect(() => invoiceCreateSchema.parse({ ...goodBody, issueDate: 'May 1 2026' })).toThrow()
  })

  it('rejects status === PAID (must be set via /status endpoint)', () => {
    expect(() => invoiceCreateSchema.parse({ ...goodBody, status: 'PAID' })).toThrow()
  })

  it('rejects taxRate > 100', () => {
    expect(() => invoiceCreateSchema.parse({ ...goodBody, taxRate: 101 })).toThrow()
  })

  it('rejects fractional line-item quantities', () => {
    expect(() =>
      invoiceCreateSchema.parse({
        ...goodBody,
        items: [{ productId: null, description: 'Bed', qty: 1.5, unitPrice: 1000 }],
      }),
    ).toThrow()
  })

  it('rejects zero or negative quantities', () => {
    expect(() =>
      invoiceCreateSchema.parse({
        ...goodBody,
        items: [{ productId: null, description: 'Bed', qty: 0, unitPrice: 1000 }],
      }),
    ).toThrow()
  })
})

describe('passwordChangeSchema', () => {
  it('rejects newPassword < 12 chars', () => {
    expect(() =>
      passwordChangeSchema.parse({ currentPassword: 'x', newPassword: 'short' }),
    ).toThrow()
  })
  it('accepts 12+ chars', () => {
    expect(() =>
      passwordChangeSchema.parse({ currentPassword: 'x', newPassword: 'a'.repeat(12) }),
    ).not.toThrow()
  })
})

describe('settingsSchema', () => {
  const base = { name: 'Bed Pro', taxRate: 15 }

  it('accepts the minimum required', () => {
    expect(() => settingsSchema.parse(base)).not.toThrow()
  })

  it('accepts an http logoUrl', () => {
    expect(() =>
      settingsSchema.parse({ ...base, logoUrl: 'https://example.com/logo.png' }),
    ).not.toThrow()
  })

  it('accepts a data:image/ logoUrl', () => {
    expect(() =>
      settingsSchema.parse({ ...base, logoUrl: 'data:image/png;base64,iVBORw0KG' }),
    ).not.toThrow()
  })

  it('rejects logoUrl that is neither http(s) nor data:image/', () => {
    expect(() =>
      settingsSchema.parse({ ...base, logoUrl: 'javascript:alert(1)' }),
    ).toThrow()
    expect(() =>
      settingsSchema.parse({ ...base, logoUrl: 'data:text/html,<script>' }),
    ).toThrow()
  })
})
