import Link from 'next/link'
import { Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeStatus, type DisplayStatus } from '@/lib/status'
import { can } from '@/lib/permissions'
import { InvoiceListClient } from './invoice-list-client'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  const scope =
    !can(session?.user.role, 'INVOICES_VIEW_ALL') && session?.user
      ? { createdById: session.user.id }
      : {}
  const invoices = await prisma.invoice.findMany({
    where: scope,
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  })

  const filter = (params.filter ?? 'all') as DisplayStatus | 'all'
  const q = (params.q ?? '').toLowerCase()

  const filtered = invoices.filter((inv) => {
    const s = computeStatus(inv)
    if (filter !== 'all' && s !== filter) return false
    if (!q) return true
    return inv.number.toLowerCase().includes(q) || inv.customer.name.toLowerCase().includes(q)
  })

  const counts = invoices.reduce<Record<string, number>>(
    (a, inv) => {
      const s = computeStatus(inv)
      a[s] = (a[s] ?? 0) + 1
      a.all = (a.all ?? 0) + 1
      return a
    },
    { all: 0 },
  )

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Invoices</h1>
          <p className="text-sm text-gray-500">{invoices.length} invoices total</p>
        </div>
        <Link href="/invoices/new" className="bp-btn-primary">
          <Plus className="h-4 w-4" /> New Invoice
        </Link>
      </div>

      <InvoiceListClient
        invoices={filtered.map((i) => ({
          id: i.id,
          number: i.number,
          status: i.status,
          dueDate: i.dueDate.toISOString(),
          total: Number(i.total),
          customer: { name: i.customer.name },
        }))}
        counts={counts}
        activeFilter={filter}
        initialQuery={params.q ?? ''}
      />
    </div>
  )
}
