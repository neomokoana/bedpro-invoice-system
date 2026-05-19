export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requireSession, ApiError } from '@/lib/api-auth'
import { can } from '@/lib/permissions'
import { renderReceiptHtml } from '@/lib/invoice-html'
import { renderPdf } from '@/lib/pdf'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession()
    if (!can(user.role, 'RECEIPTS_VIEW')) throw new ApiError(403, 'Forbidden')
    const { id } = await params

    const [receipt, company] = await Promise.all([
      prisma.receipt.findUnique({
        where: { id },
        include: { invoice: { include: { customer: true } } },
      }),
      prisma.companySettings.findUnique({ where: { id: 'singleton' } }),
    ])
    if (!receipt) throw new ApiError(404, 'Not found')
    if (!company) throw new ApiError(500, 'Company settings missing')

    const html = renderReceiptHtml(receipt, company)
    const pdf = await renderPdf(html)

    return new NextResponse(new Blob([pdf], { type: 'application/pdf' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${receipt.number}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    return apiError(e)
  }
}
