'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Printer, Trash2, Loader2, FileDown } from 'lucide-react'
import type { InvoiceStatus } from '@prisma/client'
import { StatusDropdown } from '@/components/status-dropdown'

export function InvoiceActions({
  invoiceId,
  status,
  dueDate,
  canChangeStatus,
  canEmail,
  canDelete,
  customerHasEmail,
}: {
  invoiceId: string
  status: InvoiceStatus
  dueDate: string
  canChangeStatus: boolean
  canEmail: boolean
  canDelete: boolean
  customerHasEmail: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | 'email' | 'delete'>(null)
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  async function changeStatus(id: string, target: InvoiceStatus) {
    const res = await fetch(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: target }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed' }))
      setMsg(error)
      return
    }
    setMsg(null)
    startTransition(() => router.refresh())
  }

  async function sendEmail() {
    if (!confirm('Send this invoice as a PDF to the customer?')) return
    setBusy('email')
    setMsg(null)
    const res = await fetch(`/api/invoices/${invoiceId}/email`, { method: 'POST' })
    setBusy(null)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to send' }))
      setMsg(error)
      return
    }
    setMsg('Email sent.')
    router.refresh()
  }

  async function deleteInvoice() {
    if (!confirm('Permanently delete this invoice? This cannot be undone.')) return
    setBusy('delete')
    const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' })
    setBusy(null)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to delete' }))
      setMsg(error)
      return
    }
    router.push('/invoices')
    router.refresh()
  }

  return (
    <div className="bp-card p-4 flex items-center gap-3 flex-wrap">
      {canChangeStatus ? (
        <StatusDropdown invoice={{ id: invoiceId, status, dueDate }} onChange={changeStatus} />
      ) : null}

      <a href={`/api/invoices/${invoiceId}/pdf`} target="_blank" rel="noreferrer" className="bp-btn-outline">
        <FileDown className="h-4 w-4" /> Download PDF
      </a>

      <a href={`/api/invoices/${invoiceId}/pdf?disposition=inline`} target="_blank" rel="noreferrer" className="bp-btn-outline">
        <Printer className="h-4 w-4" /> Print
      </a>

      {canEmail && (
        <button
          onClick={sendEmail}
          disabled={busy === 'email' || !customerHasEmail}
          className="bp-btn-dark"
          title={customerHasEmail ? '' : 'Customer has no email on file'}
        >
          {busy === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Email to customer
        </button>
      )}

      {canDelete && (
        <button onClick={deleteInvoice} disabled={busy === 'delete'} className="bp-btn-ghost text-red-600 ml-auto">
          {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete
        </button>
      )}

      {(msg || pending) && (
        <div className="basis-full text-xs text-gray-500">{pending ? 'Refreshing…' : msg}</div>
      )}
    </div>
  )
}
