/**
 * Email service — Nodemailer over SMTP.
 *
 *   SMTP_HOST=smtp.sendgrid.net
 *   SMTP_PORT=587
 *   SMTP_USER=apikey
 *   SMTP_PASSWORD=<SendGrid API key>     # or SMTP_PASS — both accepted
 *   EMAIL_FROM="Bed Pro <invoices@bedpro.co.za>"   # or SMTP_FROM
 *
 * If env is missing, sendMail returns { sent: false } so callers can fall back
 * to "show temp password" UX.
 */
import nodemailer, { type Transporter } from 'nodemailer'
import { logger } from './logger'

let cached: Transporter | null = null

function getTransport(): Transporter | null {
  if (cached) return cached
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  // Support either env name — your existing .env uses SMTP_PASS.
  const pass = process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  return cached
}

export type SendResult = { sent: boolean; messageId?: string; error?: string }

export type Attachment = {
  filename: string
  content: Buffer
  contentType?: string
}

export async function sendMail(args: {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Attachment[]
}): Promise<SendResult> {
  const t = getTransport()
  if (!t) {
    logger.warn('email.smtp_not_configured', { to: args.to, subject: args.subject })
    return { sent: false, error: 'SMTP not configured' }
  }
  try {
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_FROM ?? 'Bed Pro <no-reply@bedpro.co.za>',
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      attachments: args.attachments,
    })
    return { sent: true, messageId: info.messageId }
  } catch (err) {
    logger.error('email.send_failed', { to: args.to, subject: args.subject }, err)
    return { sent: false, error: err instanceof Error ? err.message : 'send failed' }
  }
}

// ── Branded email templates ───────────────────────────────────────

const RED = '#E8191A'

/**
 * Escape user-controlled strings before interpolating into the email HTML.
 * Customer names, invoice notes, company name etc. can contain `<` / `>` / `&` /
 * `"` and would otherwise render as live HTML in the recipient's mail client —
 * a stored XSS / phishing surface.
 */
function esc(s: string | null | undefined): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Only allow http(s) URLs in href / src attributes — defence against
 *  javascript: / data: links smuggled in. */
function escUrl(s: string | null | undefined): string {
  if (s == null) return '#'
  const v = String(s).trim()
  if (!/^https?:\/\//i.test(v)) return '#'
  return esc(v)
}

/**
 * Render the brand header. If we have a public https logo URL we use it; the
 * CSS text fallback covers data: URLs (which Gmail/Outlook strip) and the
 * "no logo set" case.
 */
function brandHeader(logoUrl: string | null | undefined): string {
  if (logoUrl && /^https?:\/\//i.test(logoUrl)) {
    return `<img src="${esc(logoUrl)}" alt="Bed Pro" style="height:32px;width:auto;display:block;" />`
  }
  return `<span style="font-size:24px;font-weight:800;letter-spacing:-1px;"><span style="color:${RED};">Bed</span><span style="color:#111;">Pro</span></span>`
}

function emailShell(content: string, logoUrl?: string | null): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f6f6;font-family:'DM Sans',system-ui,sans-serif;color:#111;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;">
      <tr><td align="center" style="padding:24px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
          <tr><td style="padding:24px 28px;border-bottom:3px solid ${RED};">
            ${brandHeader(logoUrl)}
          </td></tr>
          <tr><td style="padding:28px;">${content}</td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #eee;font-size:11px;color:#999;">
            Bed Pro · Pretoria, South Africa · www.bedpro.org.za
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`
}

export function invoiceEmailHtml(args: {
  customerName: string
  invoiceNumber: string
  total: string
  dueDate: string
  companyName: string
  notes?: string | null
  logoUrl?: string | null
}): string {
  return emailShell(
    `
    <p style="margin:0 0 12px;font-size:14px;">Hi ${esc(args.customerName)},</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.5;">
      Please find your invoice <strong>${esc(args.invoiceNumber)}</strong> attached as a PDF.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:18px 0;background:#fafafa;border-radius:8px;border-left:3px solid ${RED};">
      <tr><td style="padding:14px 18px;">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Total Due</div>
        <div style="font-size:28px;font-weight:800;color:${RED};margin-top:4px;">${esc(args.total)}</div>
        <div style="font-size:12px;color:#666;margin-top:2px;">Due by ${esc(args.dueDate)}</div>
      </td></tr>
    </table>
    ${args.notes ? `<p style="margin:0 0 12px;font-size:13px;color:#666;">${esc(args.notes)}</p>` : ''}
    <p style="margin:18px 0 0;font-size:13px;color:#666;">Thanks,<br/>${esc(args.companyName)}</p>
  `,
    args.logoUrl,
  )
}

export function inviteEmailHtml(args: {
  name: string
  tempPassword: string
  loginUrl: string
  role: string
  logoUrl?: string | null
}): string {
  return emailShell(
    `
    <p style="margin:0 0 12px;font-size:14px;">Hi ${esc(args.name)},</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.5;">
      An account has been created for you on the Bed Pro Invoice System with the <strong>${esc(args.role)}</strong> role.
    </p>
    <p style="margin:0 0 12px;font-size:14px;">Use this temporary password to sign in for the first time. You&apos;ll be asked to set your own password immediately:</p>
    <pre style="background:#111;color:#fff;padding:14px 18px;border-radius:8px;font-size:16px;letter-spacing:1px;font-family:Menlo,monospace;">${esc(args.tempPassword)}</pre>
    <p style="margin:18px 0 0;font-size:14px;">
      <a href="${escUrl(args.loginUrl)}" style="background:${RED};color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;display:inline-block;">Sign in</a>
    </p>
    <p style="margin:18px 0 0;font-size:11px;color:#999;">If you weren&apos;t expecting this, please ignore the email.</p>
  `,
    args.logoUrl,
  )
}
