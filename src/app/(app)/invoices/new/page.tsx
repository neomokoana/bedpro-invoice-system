import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { InvoiceForm } from '../invoice-form'

export const dynamic = 'force-dynamic'

export default async function NewInvoicePage() {
  const [session, customers, products, settings] = await Promise.all([
    auth(),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.companySettings.findUnique({ where: { id: 'singleton' } }),
  ])

  // STAFF can't email invoices; hide the Send button for them. The Print
  // button stays — any role that can create an invoice can print it.
  const canSendEmail = can(session?.user.role, 'INVOICES_SEND_EMAIL')

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-extrabold mb-6">New Invoice</h1>
      <InvoiceForm
        customers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          phone: c.phone,
          email: c.email,
          address: c.address,
        }))}
        products={products.map((p) => ({ id: p.id, name: p.name, unitPrice: Number(p.unitPrice) }))}
        defaultTaxRate={Number(settings?.taxRate ?? 15)}
        canSendEmail={canSendEmail}
      />
    </div>
  )
}
