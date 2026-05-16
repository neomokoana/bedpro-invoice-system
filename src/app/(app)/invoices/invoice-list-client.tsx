'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import type { InvoiceStatus } from '@prisma/client'
import { formatMoney, formatDate } from '@/lib/format'
import { StatusDropdown } from '@/components/status-dropdown'
import { computeStatus, daysUntilDue, type DisplayStatus } from '@/lib/status'
import { cn } from '@/lib/cn'

type Row = {
  id: string
  number: string
  status: InvoiceStatus
  dueDate: string
  total: number
  customer: { name: string }
}

const FILTERS: { id: DisplayStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'sent', label: 'Sent' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'paid', label: 'Paid' },
]

export function InvoiceListClient({
  invoices,
  counts,
  activeFilter,
  initialQuery,
}: {
  invoices: Row[]
  counts: Record<string, number>
  activeFilter: DisplayStatus | 'all'
  initialQuery: string
}) {
  const router = useRouter()
  const search = useSearchParams()
  const [q, setQ] = useState(initialQuery)
  const [pending, startTransition] = useTransition()

  function update(filter: DisplayStatus | 'all', query: string) {
    const params = new URLSearchParams(search.toString())
    if (filter === 'all') params.delete('filter')
    else params.set('filter', filter)
    if (!query) params.delete('q')
    else params.set('q', query)
    startTransition(() => router.replace(`/invoices?${params.toString()}`))
  }

  async function handleStatusChange(id: string, target: InvoiceStatus) {
    const res = await fetch(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: target }),
    })
    if (res.ok) router.refresh()
    else {
      const { error } = await res.json().catch(() => ({ error: 'Failed to update' }))
      alert(error)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              update(activeFilter, e.target.value)
            }}
            placeholder="Search by invoice # or customer…"
            className="bp-input pl-9 w-72"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => update(f.id, q)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold border',
                activeFilter === f.id
                  ? 'bg-[#111] text-white border-[#111]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
              )}
            >
              {f.label} {counts[f.id] != null && `(${counts[f.id]})`}
            </button>
          ))}
        </div>
      </div>

      <div className="bp-card overflow-hidden">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Due Date</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody className={cn(pending && 'opacity-60')}>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  No invoices match your filters.
                </td>
              </tr>
            )}
            {invoices.map((inv) => {
              const s = computeStatus(inv)
              const days = daysUntilDue(inv.dueDate)
              return (
                <tr key={inv.id}>
                  <td className="font-bold">{inv.number}</td>
                  <td>{inv.customer.name}</td>
                  <td>
                    <div>{formatDate(inv.dueDate)}</div>
                    {s !== 'paid' && s !== 'draft' && (
                      <div
                        className={cn(
                          'text-[11px] font-semibold mt-0.5',
                          s === 'overdue' ? 'text-red-600' : days <= 3 ? 'text-amber-600' : 'text-gray-400',
                        )}
                      >
                        {s === 'overdue'
                          ? `${Math.abs(days)}d overdue`
                          : days === 0
                            ? 'Due today'
                            : days === 1
                              ? 'Due tomorrow'
                              : `${days}d left`}
                      </div>
                    )}
                  </td>
                  <td className="text-right font-bold">{formatMoney(inv.total)}</td>
                  <td>
                    <StatusDropdown invoice={inv} onChange={handleStatusChange} />
                  </td>
                  <td>
                    <Link href={`/invoices/${inv.id}`} className="text-xs font-bold text-[#E8191A] hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
