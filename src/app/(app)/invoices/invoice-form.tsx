'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, UserPlus, Users, Mail, Printer, FileEdit, Check } from 'lucide-react'
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

/**
 * Submit actions:
 *  - 'draft'    → save as DRAFT, navigate to the invoice page
 *  - 'unpaid'   → save as UNPAID (finalised), navigate to the invoice page
 *  - 'send'     → save as UNPAID, email PDF to the customer, navigate
 *                  (the email API bumps status to SENT on success)
 *  - 'print'    → save as UNPAID, open the PDF in a new tab for printing,
 *                  navigate to the invoice page
 */
type SubmitAction = 'draft' | 'unpaid' | 'send' | 'print'

export function InvoiceForm({
  customers,
  products,
  defaultTaxRate,
  canSendEmail,
}: {
  customers: Customer[]
  products: Product[]
  defaultTaxRate: number
  canSendEmail: boolean
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

  const [activeAction, setActiveAction] = useState<SubmitAction | null>(null)

  async function submit(action: SubmitAction) {
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

    // 'send' requires a customer email. Catch it before saving so we don't
    // create an invoice that immediately fails to email.
    if (action === 'send') {
      const recipientEmail =
        customerMode === 'existing'
          ? customers.find((c) => c.id === customerId)?.email
          : newCustomer.email.trim()
      if (!recipientEmail) {
        return setError(
          'This customer has no email on file. Add an email before sending — or use Save & Finalise instead.',
        )
      }
    }

    setSubmitting(true)
    setActiveAction(action)

    // 1. Always save first. Drafts use DRAFT; everything else uses UNPAID.
    const status = action === 'draft' ? 'DRAFT' : 'UNPAID'
    const saveRes = await fetch('/api/invoices', {
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

    if (!saveRes.ok) {
      setSubmitting(false)
      setActiveAction(null)
      const { error: msg } = await saveRes
        .json()
        .catch(() => ({ error: 'Could not save invoice.' }))
      return setError(msg ?? 'Could not save invoice.')
    }
    const { id } = await saveRes.json()

    // 2. Action-specific follow-up.
    if (action === 'send') {
      const sendRes = await fetch(`/api/invoices/${id}/email`, { method: 'POST' })
      if (!sendRes.ok) {
        const { error: msg } = await sendRes
          .json()
          .catch(() => ({ error: 'Email could not be sent.' }))
        // Invoice was saved — navigate to it so the user can retry from there.
        alert(`Invoice saved, but the email failed: ${msg}\nYou can retry from the invoice page.`)
      }
    } else if (action === 'print') {
      // Open the PDF inline in a new tab. The browser's PDF viewer ships with
      // its own print button; the user hits Ctrl+P / Cmd+P there.
      window.open(`/api/invoices/${id}/pdf?disposition=inline`, '_blank', 'noopener')
    }

    setSubmitting(false)
    setActiveAction(null)
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
                      min="1"
                      step="1"
                      value={line.qty}
                      onChange={(e) => {
                        // Strip anything that isn't a digit so the up/down arrows
                        // AND keyboard input both stay whole-number-only.
                        const onlyDigits = e.target.value.replace(/\D/g, '')
                        updateLine(i, { qty: onlyDigits })
                      }}
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

      <div className="flex justify-end gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => submit('draft')}
          disabled={submitting}
          className="bp-btn-outline"
        >
          {activeAction === 'draft' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileEdit className="h-4 w-4" />
          )}
          Save as Draft
        </button>

        <button
          type="button"
          onClick={() => submit('unpaid')}
          disabled={submitting}
          className="bp-btn-dark"
        >
          {activeAction === 'unpaid' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Save &amp; Finalise
        </button>

        <button
          type="button"
          onClick={() => submit('print')}
          disabled={submitting}
          className="bp-btn-outline"
          title="Save the invoice and open the PDF for printing"
        >
          {activeAction === 'print' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          Save &amp; Print
        </button>

        {canSendEmail && (
          <button
            type="button"
            onClick={() => submit('send')}
            disabled={submitting}
            className="bp-btn-primary"
            title="Save the invoice and email a PDF copy to the customer"
          >
            {activeAction === 'send' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Save &amp; Send to customer
          </button>
        )}
      </div>
    </div>
  )
}
