import { prisma } from '@/lib/prisma'
import { CustomersClient } from './customers-client'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-extrabold mb-6">Customers</h1>
      <CustomersClient
        initial={customers.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          email: c.email,
          phone: c.phone,
          address: c.address,
        }))}
      />
    </div>
  )
}
