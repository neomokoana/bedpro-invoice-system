import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission, ApiError } from '@/lib/api-auth'
import { invoiceCreateSchema } from '@/lib/validators'
import { calcTotals } from '@/lib/totals'
import { nextInvoiceNumber } from '@/lib/numbering'

export async function GET() {
  try {
    const user = await requirePermission('INVOICES_CREATE')
    // STAFF only see their own invoices.
    const where = user.role === 'STAFF' ? { createdById: user.id } : {}
    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(invoices)
  } catch (e) {
    return apiError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('INVOICES_CREATE')
    const body = await req.json()
    const data = invoiceCreateSchema.parse(body)

    // Always compute totals server-side. Never trust client totals.
    const totals = calcTotals(data.items, data.taxRate, data.discount)

    const invoice = await prisma.$transaction(async (tx) => {
      // Resolve the customer: either re-use an existing one by id, or create a
      // new one from the form data. Both paths live inside the same transaction
      // so a failure later (e.g. invoice number allocation) rolls back any
      // accidentally-created customer too.
      let customerId: string
      if (data.customer.id) {
        const existing = await tx.customer.findUnique({
          where: { id: data.customer.id },
          select: { id: true, isActive: true },
        })
        if (!existing || !existing.isActive) {
          throw new ApiError(400, 'Selected customer no longer exists.')
        }
        customerId = existing.id
      } else {
        const created = await tx.customer.create({
          data: {
            name: data.customer.name,
            phone: data.customer.phone ?? null,
            email: data.customer.email ?? null,
            address: data.customer.address ?? null,
          },
          select: { id: true },
        })
        customerId = created.id
      }

      const number = await nextInvoiceNumber(tx)
      return tx.invoice.create({
        data: {
          number,
          customerId,
          status: data.status,
          issueDate: new Date(data.issueDate + 'T00:00:00Z'),
          dueDate: new Date(data.dueDate + 'T00:00:00Z'),
          taxRate: data.taxRate,
          discount: data.discount,
          subtotal: totals.subtotal,
          discountAmt: totals.discountAmt,
          taxAmount: totals.taxAmount,
          total: totals.total,
          notes: data.notes ?? null,
          createdById: user.id,
          items: {
            create: data.items.map((it) => ({
              productId: it.productId,
              description: it.description,
              qty: it.qty,
              unitPrice: it.unitPrice,
              lineTotal: Math.round(it.qty * it.unitPrice * 100) / 100,
            })),
          },
        },
        select: { id: true, number: true },
      })
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
