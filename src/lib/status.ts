/**
 * Status engine — auto-detection of overdue.
 *
 *   Priority:  PAID  >  DRAFT  >  overdue (AUTO, computed)  >  SENT  >  UNPAID
 *
 * `overdue` is NEVER stored — it is computed live from the due date.
 * The DB only knows the four stored statuses: DRAFT / UNPAID / SENT / PAID.
 */
import type { InvoiceStatus } from '@prisma/client'

export type DisplayStatus = 'paid' | 'draft' | 'overdue' | 'sent' | 'unpaid'

export function computeStatus(invoice: {
  status: InvoiceStatus
  dueDate: Date | string
}): DisplayStatus {
  if (invoice.status === 'PAID') return 'paid'
  if (invoice.status === 'DRAFT') return 'draft'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due =
    typeof invoice.dueDate === 'string'
      ? new Date(invoice.dueDate.slice(0, 10) + 'T00:00:00')
      : new Date(invoice.dueDate)
  due.setHours(0, 0, 0, 0)
  if (due < today) return 'overdue'
  if (invoice.status === 'SENT') return 'sent'
  return 'unpaid'
}

export function daysUntilDue(dueDate: Date | string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due =
    typeof dueDate === 'string'
      ? new Date(dueDate.slice(0, 10) + 'T00:00:00')
      : new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  sent: 'Sent',
  draft: 'Draft',
  overdue: 'Overdue',
}

export const STATUS_DESC: Record<DisplayStatus, string> = {
  paid: 'Payment received & confirmed',
  unpaid: 'Invoice sent, awaiting payment',
  sent: 'Email sent to client',
  draft: 'Not yet finalised or sent',
  overdue: 'Past due date — follow up',
}

export const STATUS_TRANSITIONS: Record<DisplayStatus, { target: InvoiceStatus; label: string }[]> = {
  draft: [
    { target: 'UNPAID', label: 'Mark as Unpaid' },
    { target: 'PAID', label: 'Mark as Paid' },
  ],
  unpaid: [
    { target: 'PAID', label: 'Mark as Paid' },
    { target: 'SENT', label: 'Mark as Sent' },
    { target: 'DRAFT', label: 'Revert to Draft' },
  ],
  sent: [
    { target: 'PAID', label: 'Mark as Paid' },
    { target: 'UNPAID', label: 'Mark as Unpaid' },
  ],
  overdue: [
    { target: 'PAID', label: 'Mark as Paid' },
    { target: 'UNPAID', label: 'Reset to Unpaid' },
  ],
  paid: [{ target: 'UNPAID', label: 'Undo — Mark Unpaid' }],
}
