import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requirePermission, ApiError } from '@/lib/api-auth'
import { InvoiceDocument } from '@/lib/invoice-pdf'
import { renderPdf } from '@/lib/pdf'
import { sendMail, invoiceEmailHtml } from '@/lib/email'
import { formatMoney, formatDate } from '@/lib/format'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission('INVOICES_SEND_EMAIL')
    const { id } = await params

    const [invoice, company] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id },
        include: { customer: true, items: true },
      }),
      prisma.companySettings.findUnique({ where: { id: 'singleton' } }),
    ])
    if (!invoice) throw new ApiError(404, 'Invoice not found')
    if (!invoice.customer.email) throw new ApiError(400, 'Customer has no email on file')
    if (!company) throw new ApiError(500, 'Company settings missing')

    const pdf = await renderPdf(InvoiceDocument({ invoice, company }))

    const result = await sendMail({
      to: invoice.customer.email,
      subject: `Invoice ${invoice.number} from ${company.name}`,
      html: invoiceEmailHtml({
        customerName: invoice.customer.name,
        invoiceNumber: invoice.number,
        total: formatMoney(Number(invoice.total)),
        dueDate: formatDate(invoice.dueDate),
        companyName: company.name,
        notes: invoice.notes,
        logoUrl: company.logoUrl,
      }),
      attachments: [
        {
          filename: `${invoice.number}.pdf`,
          // Nodemailer wants Buffer — Puppeteer gave us Uint8Array. Zero-copy.
          content: Buffer.from(pdf),
          contentType: 'application/pdf',
        },
      ],
    })

    if (!result.sent) {
      // Don't forward Nodemailer's raw error message to the client — it can
      // include SMTP host, auth-failure reasons, RCPT errors etc. that leak
      // infrastructure details. The full error is already logged by sendMail.
      throw new ApiError(500, 'Could not send the email. Please try again later.')
    }

    // Bump status to SENT (if still DRAFT/UNPAID) and stamp emailedAt.
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        emailedAt: new Date(),
        status:
          invoice.status === 'DRAFT' || invoice.status === 'UNPAID' ? 'SENT' : invoice.status,
      },
    })

    return NextResponse.json({ ok: true, messageId: result.messageId })
  } catch (e) {
    return apiError(e)
  }
}
