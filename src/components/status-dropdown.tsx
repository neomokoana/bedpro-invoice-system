'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import type { InvoiceStatus } from '@prisma/client'
import { computeStatus, STATUS_TRANSITIONS, STATUS_DESC, daysUntilDue } from '@/lib/status'
import { StatusBadge } from './status-badge'

export function StatusDropdown({
  invoice,
  onChange,
  disabled,
}: {
  invoice: { id: string; status: InvoiceStatus; dueDate: Date | string }
  onChange: (id: string, target: InvoiceStatus) => Promise<void> | void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const computed = computeStatus(invoice)
  const transitions = STATUS_TRANSITIONS[computed]

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 disabled:opacity-60"
      >
        <StatusBadge status={computed} />
        {!disabled && transitions.length > 0 && <ChevronDown className="h-3 w-3 text-gray-400" />}
      </button>

      {open && !disabled && (
        <div className="absolute z-30 right-0 mt-2 w-72 rounded-xl bg-white border border-gray-200 shadow-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-400">Current status</div>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={computed} />
            <div className="text-[11px] text-gray-500">{STATUS_DESC[computed]}</div>
          </div>
          {computed === 'overdue' && (
            <div className="mt-2 rounded-md bg-red-50 border border-red-200 px-2 py-1 text-[11px] text-red-700 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              Auto-detected · Due date was {Math.abs(daysUntilDue(invoice.dueDate))}d ago
            </div>
          )}

          {transitions.length > 0 && (
            <>
              <div className="my-3 border-t border-gray-100" />
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Change to</div>
              <div className="space-y-1">
                {transitions.map((t) => (
                  <button
                    key={t.target}
                    type="button"
                    disabled={pending}
                    onClick={async () => {
                      setPending(true)
                      try {
                        await onChange(invoice.id, t.target)
                        setOpen(false)
                      } finally {
                        setPending(false)
                      }
                    }}
                    className="w-full text-left rounded-md px-2 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
