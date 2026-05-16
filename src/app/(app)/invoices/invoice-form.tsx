'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { calcTotals } from '@/lib/totals'
import { formatMoney, todayStr, addDaysStr } from '@/lib/format'

type Customer = { id: string; name: string; company: string | null }
type Product = { id: string; name: string; unitPrice: number }
type Line = {
  productId: string | null
  description: string
  qty: string
  unitPrice: string
}

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
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
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
    if (!customerId) return setError('Pick a customer.')
    if (!lines.length || lines.every((l) => !l.description.trim()))
      return setError('Add at least one line item.')

    setSubmitting(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerId,
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="bp-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="bp-label mb-1 block">Customer</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="bp-input">
            {customers.length === 0 && <option value="">No customers — create one first</option>}
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` (${c.company})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="bp-label mb-1 block">Issue date</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="bp-input" />
          </div>
          <div>
            <label className="bp-label mb-1 block">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bp-input" />
          </div>
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
