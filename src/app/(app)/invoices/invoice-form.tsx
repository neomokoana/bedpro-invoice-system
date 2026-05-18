'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, UserPlus, Users } from 'lucide-react'
import { calcTotals } from '@/lib/totals'
import { formatMoney, todayStr, addDaysStr } from '@/lib/format'
import { cn } from '@/lib/cn'

type Customer = {
  id: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
  address: string | null
}
type Product = { id: string; name: string; unitPrice: number }
type Line = {
  productId: string | null
  description: string
  qty: string
  unitPrice: string
}
type CustomerMode = 'existing' | 'new'

export function InvoiceForm({
  customers,
  products,
  defaultTaxRate,
}: {
  customers: Customer[]
  products: Product[]
  defaultTaxRate: number
}) {
  const router = useRouter()
  const [customerMode, setCustomerMode] = useState<CustomerMode>(
    customers.length > 0 ? 'existing' : 'new',
  )
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })
  const [issueDate, setIssueDate] = useState(todayStr())
  const [dueDate, setDueDate] = useState(addDaysStr(15))
  const [taxRate, setTaxRate] = useState(String(defaultTaxRate))
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<Line[]>([
    { productId: null, description: '', qty: '1', unitPrice: '0' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totals = useMemo(() => calcTotals(lines, taxRate, discount), [lines, taxRate, discount])

  function addLine() {
    setLines((l) => [...l, { productId: null, description: '', qty: '1', unitPrice: '0' }])
  }
  function removeLine(i: number) {
    setLines((l) => l.filter((_, idx) => idx !== i))
  }
  function updateLine(i: number, patch: Partial<Line>) {
    setLines((l) => l.map((line, idx) => (idx === i ? { ...line, ...patch } : line)))
  }
  function pickProduct(i: number, productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) {
      updateLine(i, { productId: null })
      return
    }
    updateLine(i, { productId: p.id, description: p.name, unitPrice: String(p.unitPrice) })
  }

  async function submit(status: 'DRAFT' | 'UNPAID') {
    setError(null)

    // Build the customer payload based on which mode the form is in.
    let customerPayload: {
      id?: string
      name: string
      phone?: string
      email?: string
      address?: string
    }
    if (customerMode === 'existing') {
      const selected = customers.find((c) => c.id === customerId)
      if (!selected) return setError('Pick a customer.')
      customerPayload = { id: selected.id, name: selected.name }
    } else {
      const name = newCustomer.name.trim()
      if (!name) return setError('Enter a customer name.')
      customerPayload = {
        name,
        phone: newCustomer.phone.trim() || undefined,
        email: newCustomer.email.trim() || undefined,
        address: newCustomer.address.trim() || undefined,
      }
    }

    if (!lines.length || lines.every((l) => !l.description.trim()))
      return setError('Add at least one line item.')

    setSubmitting(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customer: customerPayload,
        issueDate,
        dueDate,
        taxRate: Number(taxRate),
        discount: Number(discount),
        notes,
        status,
        items: lines
          .filter((l) => l.description.trim())
          .map((l) => ({
            productId: l.productId,
            description: l.description.trim(),
            qty: Number(l.qty),
            unitPrice: Number(l.unitPrice),
          })),
      }),
    })
    setSubmitting(false)

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Could not save invoice.' }))
      return setError(msg ?? 'Could not save invoice.')
    }
    const { id } = await res.json()
    router.push(`/invoices/${id}`)
    router.refresh()
  }

  const selectedExisting = customers.find((c) => c.id === customerId)

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* ── Customer Info ──────────────────────────────────────── */}
      <div className="bp-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold">Customer info</h2>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            <button
              type="button"
              onClick={() => setCustomerMode('existing')}
              disabled={customers.length === 0}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition',
                customerMode === 'existing'
                  ? 'bg-white text-[#111] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
                customers.length === 0 && 'opacity-50 cursor-not-allowed',
              )}
              title={customers.length === 0 ? 'No customers yet — add a new one' : ''}
            >
              <Users className="h-3.5 w-3.5" /> Existing
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode('new')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition',
                customerMode === 'new' ? 'bg-white text-[#111] shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <UserPlus className="h-3.5 w-3.5" /> New
            </button>
          </div>
        </div>

        {customerMode === 'existing' ? (
          <div className="space-y-3">
            <div>
              <label className="bp-label mb-1 block">Customer name</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="bp-input"
              >
                {customers.length === 0 && <option value="">No customers — switch to New</option>}
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` (${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedExisting && (
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-[12px] text-gray-600 space-y-0.5">
                <div>
                  <span className="text-gray-400">Phone:</span> {selectedExisting.phone ?? '—'}
                </div>
                <div>
                  <span className="text-gray-400">Email:</span> {selectedExisting.email ?? '—'}
                </div>
                <div>
                  <span className="text-gray-400">Address:</span> {selectedExisting.address ?? '—'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="bp-label mb-1 block">
                Customer name <span className="text-[#E8191A]">*</span>
              </label>
              <input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="bp-input"
                placeholder="e.g. Themba Nkosi"
                required
              />
            </div>
            <div>
              <label className="bp-label mb-1 block">Phone</label>
              <input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="bp-input"
                placeholder="082 456 7890"
              />
            </div>
            <div>
              <label className="bp-label mb-1 block">Email</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="bp-input"
                placeholder="customer@example.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="bp-label mb-1 block">
                Delivery address{' '}
                <span className="text-gray-400 font-normal normal-case tracking-normal">
                  — optional, only if you&apos;re delivering
                </span>
              </label>
              <input
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="bp-input"
                placeholder="14 Oak Street, Pretoria"
              />
            </div>
            <p className="md:col-span-2 text-[11px] text-gray-500">
              This will create a new customer record so you can re-use them on future invoices.
            </p>
          </div>
        )}
      </div>

      {/* ── Dates ──────────────────────────────────────────────── */}
      <div className="bp-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="bp-label mb-1 block">Issue date</label>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="bp-input" />
        </div>
        <div>
          <label className="bp-label mb-1 block">Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bp-input" />
        </div>
      </div>

      <div className="bp-card overflow-hidden">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Product / Description</th>
              <th className="w-24 text-right">Qty</th>
              <th className="w-36 text-right">Unit price</th>
              <th className="w-36 text-right">Line total</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const lineTotal = Number(line.qty) * Number(line.unitPrice) || 0
              return (
                <tr key={i}>
                  <td>
                    <select
                      value={line.productId ?? ''}
                      onChange={(e) => pickProduct(i, e.target.value)}
                      className="bp-input mb-1"
                    >
                      <option value="">— Custom line —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatMoney(p.unitPrice)})
                        </option>
                      ))}
                    </select>
                    <input
                      value={line.description}
                      onChange={(e) => updateLine(i, { description: e.target.value })}
                      placeholder="Description"
                      className="bp-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.qty}
                      onChange={(e) => updateLine(i, { qty: e.target.value })}
                      className="bp-input text-right"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
                      className="bp-input text-right"
                    />
                  </td>
                  <td className="text-right font-bold">{formatMoney(lineTotal)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-40"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100">
          <button type="button" onClick={addLine} className="bp-btn-ghost text-xs">
            <Plus className="h-3 w-3" /> Add line
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bp-card p-6 space-y-3">
          <label className="bp-label block">Notes (printed on invoice)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="bp-input"
            placeholder="Thanks for your business!"
          />
        </div>
        <div className="bp-card p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="bp-label mb-1 block">VAT %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="bp-input"
              />
            </div>
            <div>
              <label className="bp-label mb-1 block">Discount %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="bp-input"
              />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            {totals.discountAmt > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount</span>
                <span>−{formatMoney(totals.discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>VAT</span>
              <span>{formatMoney(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-lg pt-2 border-t border-gray-100 mt-2">
              <span>Total</span>
              <span className="text-[#E8191A]">{formatMoney(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => submit('DRAFT')} disabled={submitting} className="bp-btn-outline">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save as Draft
        </button>
        <button type="button" onClick={() => submit('UNPAID')} disabled={submitting} className="bp-btn-primary">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save & Finalise
        </button>
      </div>
    </div>
  )
}
