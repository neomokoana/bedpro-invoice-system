import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.mustChangePassword) redirect('/set-password')

  // Overdue count for the sidebar badge — computed live (overdue is not stored).
  // Scoped to the user's own invoices when they don't have view-all rights.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdueCount = await prisma.invoice.count({
    where: {
      status: { in: ['UNPAID', 'SENT'] },
      dueDate: { lt: today },
      ...(can(session.user.role, 'INVOICES_VIEW_ALL') ? {} : { createdById: session.user.id }),
    },
  })

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F6F6]">
      <Sidebar user={session.user} overdueCount={overdueCount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-auto px-8 py-6">{children}</main>
      </div>
    </div>
  )
}
