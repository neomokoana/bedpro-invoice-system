import { prisma } from '@/lib/prisma'
import { ProductsClient } from './products-client'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold mb-6">Products</h1>
      <ProductsClient
        initial={products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          unitPrice: Number(p.unitPrice),
        }))}
      />
    </div>
  )
}
