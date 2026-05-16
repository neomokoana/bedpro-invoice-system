import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requireSession, ApiError } from '@/lib/api-auth'
import { can } from '@/lib/permissions'
import { invoiceStatusSchema } from '@/lib/validators'
import { nextReceiptNumber } from '@/lib/numbering'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession()
    const { id } = await params
    const body = await req.json()
    const { status, paymentMethod, paymentReference } = invoiceStatusSchema.parse(body)

    if (status === 'PAID' && !can(user.role, 'INVOICES_MARK_PAID')) {
      throw new ApiError(403, 'Only managers and admins can mark invoices paid.')
    }
    if (status !== 'PAID' && !can(user.role, 'INVOICES_UPDATE')) {
      throw new ApiError(403, 'You do not have permission to change invoice status.')
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({ where: { id } })
      if (!existing) throw new ApiError(404, 'Not found')

      // paidAt rules: → PAID stamps now; away from PAID clears; otherwise keep.
      const paidAt =
        status === 'PAID'
          ? new Date()
          : existing.status === 'PAID'
            ? null
            : existing.paidAt

      const updated = await tx.invoice.update({
        where: { id },
        data: { status, paidAt },
      })

      // Auto-create a Receipt when transitioning to PAID.
      if (status === 'PAID' && existing.status !== 'PAID') {
        const number = await nextReceiptNumber(tx)
        await tx.receipt.create({
          data: {
            number,
            invoiceId: updated.id,
            amount: updated.total,
            paymentDate: new Date(),
            method: paymentMethod ?? 'EFT',
            reference: paymentReference ?? null,
            createdById: user.id,
          },
        })
      }

      return updated
    })

    return NextResponse.json({ id: result.id, status: result.status })
  } catch (e) {
    return apiError(e)
  }
}
