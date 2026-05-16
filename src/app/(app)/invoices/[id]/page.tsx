import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatMoney, formatDate } from '@/lib/format'
import { computeStatus } from '@/lib/status'
import { StatusBadge } from '@/components/status-badge'
import { can } from '@/lib/permissions'
import { InvoiceActions } from './invoice-actions'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return null

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      receipts: { orderBy: { createdAt: 'desc' } },
      createdBy: { select: { name: true, email: true } },
    },
  })
  if (!invoice) notFound()

  if (!can(session.user.role, 'INVOICES_VIEW_ALL') && invoice.createdById !== session.user.id) {
    notFound()
  }

  const displayStatus = computeStatus(invoice)

  return (
    <div className="max-w-5xl">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </Link>

      <div className="bp-card p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold">{invoice.number}</h1>
              <StatusBadge status={displayStatus} />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)} · Created by {invoice.createdBy.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-gray-400 tracking-wider">Total</div>
            <div className="text-3xl font-extrabold text-[#E8191A]">{formatMoney(Number(invoice.total))}</div>
          </div>
        </div>
      </div>

      <InvoiceActions
        invoiceId={invoice.id}
        status={invoice.status}
        dueDate={invoice.dueDate.toISOString()}
        canChangeStatus={can(session.user.role, 'INVOICES_MARK_PAID')}
        canEmail={can(session.user.role, 'INVOICES_SEND_EMAIL')}
        canDelete={can(session.user.role, 'INVOICES_DELETE')}
        customerHasEmail={!!invoice.customer.email}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bp-card p-5 md:col-span-1">
          <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Bill to</h2>
          <div className="font-bold">{invoice.customer.name}</div>
          {invoice.customer.company && <div className="text-sm text-gray-500">{invoice.customer.company}</div>}
          <div className="text-[12px] text-gray-500 mt-2 leading-relaxed">
            {invoice.customer.email}
            <br />
            {invoice.customer.phone}
            <br />
            {invoice.customer.address}
          </div>
        </div>

        <div className="bp-card p-5 md:col-span-2 overflow-hidden">
          <table className="bp-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="w-20 text-right">Qty</th>
                <th className="w-32 text-right">Unit</th>
                <th className="w-32 text-right">Line</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.description}</td>
                  <td className="text-right">{Number(it.qty)}</td>
                  <td className="text-right">{formatMoney(Number(it.unitPrice))}</td>
                  <td className="text-right font-bold">{formatMoney(Number(it.lineTotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto w-full md:w-72 mt-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatMoney(Number(invoice.subtotal))}</span>
            </div>
            {Number(invoice.discountAmt) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount ({Number(invoice.discount)}%)</span>
                <span>−{formatMoney(Number(invoice.discountAmt))}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>VAT ({Number(invoice.taxRate)}%)</span>
              <span>{formatMoney(Number(invoice.taxAmount))}</span>
            </div>
            <div className="flex justify-between font-extrabold text-lg pt-2 border-t border-gray-100 mt-2">
              <span>Total</span>
              <span className="text-[#E8191A]">{formatMoney(Number(invoice.total))}</span>
            </div>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="bp-card p-4 mt-4 border-l-4 border-l-[#E8191A]">
          <div className="text-xs uppercase text-gray-400 tracking-wider mb-1">Notes</div>
          <div className="text-sm">{invoice.notes}</div>
        </div>
      )}

      {invoice.receipts.length > 0 && (
        <div className="bp-card mt-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-bold">Receipts</div>
          <table className="bp-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoice.receipts.map((r) => (
                <tr key={r.id}>
                  <td className="font-bold">{r.number}</td>
                  <td>{formatDate(r.paymentDate)}</td>
                  <td>{r.method}</td>
                  <td>{r.reference ?? '—'}</td>
                  <td className="text-right font-bold">{formatMoney(Number(r.amount))}</td>
                  <td>
                    {can(session.user.role, 'RECEIPTS_VIEW') && (
                      <a
                        href={`/api/receipts/${r.id}/pdf`}
                        className="text-xs font-bold text-[#E8191A] hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        PDF →
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
