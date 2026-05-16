import Link from 'next/link'
import { FileText, TrendingUp, Clock, AlertCircle, Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeStatus } from '@/lib/status'
import { formatMoney, formatDate } from '@/lib/format'
import { StatusBadge } from '@/components/status-badge'
import { can } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  // STAFF only see metrics on the invoices they created — never the company-wide rollup.
  const scope =
    !can(session?.user.role, 'INVOICES_VIEW_ALL') && session?.user
      ? { createdById: session.user.id }
      : {}

  const [invoices, customers] = await Promise.all([
    prisma.invoice.findMany({
      where: scope,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count(),
  ])

  const stats = invoices.reduce(
    (a, inv) => {
      const s = computeStatus(inv)
      const total = Number(inv.total)
      a.total += 1
      if (s === 'paid') a.revenue += total
      if (s === 'unpaid' || s === 'sent' || s === 'overdue') a.outstanding += total
      if (s === 'overdue') a.overdue += 1
      return a
    },
    { total: 0, revenue: 0, outstanding: 0, overdue: 0 },
  )

  const recent = invoices.slice(0, 5)

  const cards = [
    { label: 'Total Invoices', value: stats.total, sub: 'All time', color: '#111', Icon: FileText },
    { label: 'Revenue Collected', value: formatMoney(stats.revenue), sub: 'Paid invoices', color: '#16a34a', Icon: TrendingUp },
    { label: 'Outstanding', value: formatMoney(stats.outstanding), sub: 'Awaiting payment', color: '#d97706', Icon: Clock },
    { label: 'Overdue', value: stats.overdue, sub: 'Needs attention', color: '#E8191A', Icon: AlertCircle },
  ]

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back — here&apos;s your business overview ({customers} customers).</p>
        </div>
        <Link href="/invoices/new" className="bp-btn-primary">
          <Plus className="h-4 w-4" /> New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => {
          const Icon = c.Icon
          return (
            <div key={c.label} className="bp-card p-4">
              <div className="flex justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-gray-400">{c.label}</div>
                  <div className="text-2xl font-extrabold mt-1" style={{ color: c.color }}>
                    {c.value}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">{c.sub}</div>
                </div>
                <Icon className="h-5 w-5" style={{ color: c.color }} />
              </div>
            </div>
          )
        })}
      </div>

      {stats.overdue > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-4">
          <AlertCircle className="h-5 w-5 text-[#E8191A]" />
          <div className="text-sm">
            <strong>{stats.overdue}</strong> invoice{stats.overdue === 1 ? '' : 's'} overdue —{' '}
            <span className="text-gray-600">auto-detected from due dates.</span>
          </div>
          <Link href="/invoices?filter=overdue" className="ml-auto text-xs font-bold text-[#E8191A] hover:underline">
            View overdue →
          </Link>
        </div>
      )}

      <div className="bp-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold">Recent Invoices</h2>
          <Link href="/invoices" className="text-xs font-bold text-[#E8191A] hover:underline">
            View All →
          </Link>
        </div>
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
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">No invoices yet.</td>
              </tr>
            )}
            {recent.map((inv) => (
              <tr key={inv.id}>
                <td className="font-bold">{inv.number}</td>
                <td>{inv.customer.name}</td>
                <td>{formatDate(inv.dueDate)}</td>
                <td className="text-right font-bold">{formatMoney(Number(inv.total))}</td>
                <td><StatusBadge status={computeStatus(inv)} /></td>
                <td>
                  <Link href={`/invoices/${inv.id}`} className="text-xs font-bold text-[#E8191A] hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
