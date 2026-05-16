import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requireSession, ApiError } from '@/lib/api-auth'
import { can } from '@/lib/permissions'
import { renderInvoiceHtml } from '@/lib/invoice-html'
import { renderPdf } from '@/lib/pdf'

// Puppeteer needs the Node.js runtime, not Edge.
export const runtime = 'nodejs'
// 60s gives chromium enough time on cold-start Vercel functions.
export const maxDuration = 60

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession()
    const { id } = await params

    const [invoice, company] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id },
        include: { customer: true, items: true },
      }),
      prisma.companySettings.findUnique({ where: { id: 'singleton' } }),
    ])
    if (!invoice) throw new ApiError(404, 'Not found')
    if (!can(user.role, 'INVOICES_VIEW_ALL') && invoice.createdById !== user.id) {
      throw new ApiError(404, 'Not found')
    }
    if (!company) throw new ApiError(500, 'Company settings missing')

    const html = renderInvoiceHtml(invoice, company)
    const pdf = await renderPdf(html)

    const disposition =
      req.nextUrl.searchParams.get('disposition') === 'inline'
        ? `inline; filename="${invoice.number}.pdf"`
        : `attachment; filename="${invoice.number}.pdf"`

    return new NextResponse(new Blob([pdf], { type: 'application/pdf' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    return apiError(e)
  }
}
