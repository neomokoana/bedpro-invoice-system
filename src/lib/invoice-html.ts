/**
 * Branded invoice/receipt HTML. Inlined CSS so Puppeteer renders without
 * fetching anything but the Google Fonts stylesheet (which Chromium handles
 * in <1s).
 */
import type { Invoice, InvoiceItem, Customer, CompanySettings, Receipt } from '@prisma/client'
import { formatMoney, formatDate } from './format'

const RED = '#E8191A'

function escape(s: string | null | undefined): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Header logo. If CompanySettings.logoUrl is set we use that image (Puppeteer
 * will fetch it during rendering — must be a publicly reachable URL or a
 * `data:` URL). Otherwise we fall back to the CSS-text "BedPro" logo so the
 * mark always appears on the invoice.
 */
function renderLogoMarkup(logoUrl: string | null | undefined): string {
  if (logoUrl) {
    return `<img src="${escape(logoUrl)}" alt="Bed Pro" style="height:46px;width:auto;display:block;" />`
  }
  return `<div class="logo"><span class="b">Bed</span><span class="p">Pro</span></div>`
}

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escape(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',system-ui,sans-serif;color:#111;background:#fff;padding:32px 40px;font-size:13px;}
  .logo{font-size:32px;font-weight:800;letter-spacing:-1px;line-height:1;}
  .logo .b{color:${RED};} .logo .p{color:#111;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${RED};padding-bottom:24px;margin-bottom:30px;}
  .doctype{font-size:28px;font-weight:800;color:${RED};letter-spacing:2px;text-transform:uppercase;}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:30px;}
  .lbl{font-size:10px;font-weight:700;color:#bbb;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;}
  .amt{font-size:28px;font-weight:800;color:${RED};}
  .meta{font-size:11px;color:#aaa;margin-top:4px;}
  table{width:100%;border-collapse:collapse;margin-bottom:18px;}
  thead tr{background:#111;}
  th{padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#fff;letter-spacing:.5px;text-transform:uppercase;}
  th.r{text-align:right;}
  tbody tr{border-bottom:1px solid #f0f0f0;}
  td{padding:11px 14px;font-size:12px;}
  td.r{text-align:right;} td.b{font-weight:700;}
  .totals{margin-left:auto;width:260px;}
  .tr2{display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#777;border-bottom:1px solid #f5f5f5;}
  .tt{display:flex;justify-content:space-between;padding:12px 0 0;font-size:18px;font-weight:800;}
  .tt .v{color:${RED};}
  .notes{margin-top:20px;padding:12px;background:#fafafa;border-radius:8px;border-left:3px solid ${RED};font-size:12px;color:#666;}
  .footer{margin-top:36px;padding-top:14px;border-top:1px solid #eee;text-align:center;font-size:10px;color:#bbb;}
  .stamp{display:inline-block;border:3px solid #16a34a;color:#16a34a;padding:6px 16px;font-weight:800;font-size:18px;letter-spacing:2px;transform:rotate(-6deg);border-radius:4px;}
</style>
</head>
<body>${body}</body>
</html>`
}

export function renderInvoiceHtml(
  invoice: Invoice & { items: InvoiceItem[]; customer: Customer },
  company: CompanySettings,
): string {
  const itemRows = invoice.items
    .map(
      (i) =>
        `<tr><td>${escape(i.description)}</td><td class="r">${Number(i.qty)}</td><td class="r">${formatMoney(Number(i.unitPrice))}</td><td class="r b">${formatMoney(Number(i.lineTotal))}</td></tr>`,
    )
    .join('')

  const bankBlock =
    company.bankName || company.bankAccountName || company.bankAccountNumber
      ? `<div class="notes" style="border-left-color:${RED}">
          ${company.bankName ? `<div><strong>BANK:</strong> ${escape(company.bankName)}</div>` : ''}
          ${company.bankBranch ? `<div><strong>BRANCH:</strong> ${escape(company.bankBranch)}</div>` : ''}
          ${company.bankAccountName ? `<div><strong>ACCOUNT:</strong> ${escape(company.bankAccountName)}</div>` : ''}
          ${company.bankAccountNumber ? `<div><strong>ACC NO:</strong> ${escape(company.bankAccountNumber)}</div>` : ''}
        </div>`
      : ''

  const isPaid = invoice.status === 'PAID'
  const logoMarkup = renderLogoMarkup(company.logoUrl)

  const body = `
<div class="header">
  <div>
    ${logoMarkup}
    <div class="meta">${escape(company.address)}</div>
    <div class="meta">${escape(company.phone)} · ${escape(company.email)}${company.vatNumber ? ` · VAT: ${escape(company.vatNumber)}` : ''}</div>
  </div>
  <div style="text-align:right;">
    <div class="doctype">Invoice</div>
    <div style="font-size:18px;font-weight:800;margin-top:4px;">${escape(invoice.number)}</div>
    <div class="meta">Issue: ${formatDate(invoice.issueDate)}</div>
    <div class="meta">Due: ${formatDate(invoice.dueDate)}</div>
  </div>
</div>

<div class="two">
  <div>
    <div class="lbl">Bill to</div>
    <div style="font-size:14px;font-weight:700;">${escape(invoice.customer.name)}</div>
    ${invoice.customer.company ? `<div style="font-size:12px;color:#888;">${escape(invoice.customer.company)}</div>` : ''}
    <div class="meta" style="line-height:1.7;">
      ${escape(invoice.customer.email)}<br/>
      ${escape(invoice.customer.phone)}<br/>
      ${escape(invoice.customer.address)}
    </div>
  </div>
  <div style="text-align:right;">
    <div class="lbl">${isPaid ? 'Total Paid' : 'Amount Due'}</div>
    <div class="amt">${formatMoney(Number(invoice.total))}</div>
    <div class="meta">${isPaid ? 'Paid in full' : `Due by ${formatDate(invoice.dueDate)}`}</div>
    ${isPaid ? `<div style="margin-top:12px;"><span class="stamp">PAID</span></div>` : ''}
  </div>
</div>

<table>
  <thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Total</th></tr></thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="totals">
  <div class="tr2"><span>Subtotal</span><span>${formatMoney(Number(invoice.subtotal))}</span></div>
  ${Number(invoice.discountAmt) > 0 ? `<div class="tr2"><span>Discount (${Number(invoice.discount)}%)</span><span>−${formatMoney(Number(invoice.discountAmt))}</span></div>` : ''}
  <div class="tr2"><span>VAT (${Number(invoice.taxRate)}%)</span><span>${formatMoney(Number(invoice.taxAmount))}</span></div>
  <div class="tt"><span>TOTAL DUE</span><span class="v">${formatMoney(Number(invoice.total))}</span></div>
</div>

${invoice.notes ? `<div class="notes">${escape(invoice.notes)}</div>` : ''}
${bankBlock}

<div class="footer">
  <strong style="color:#111;">${escape(company.name)}</strong> · Thank you for your business · ${escape(company.address)}
</div>`

  return shell(`Invoice ${invoice.number} — ${company.name}`, body)
}

export function renderReceiptHtml(
  receipt: Receipt & { invoice: Invoice & { customer: Customer } },
  company: CompanySettings,
): string {
  const inv = receipt.invoice
  const logoMarkup = renderLogoMarkup(company.logoUrl)
  const body = `
<div class="header">
  <div>
    ${logoMarkup}
    <div class="meta">${escape(company.address)}</div>
    <div class="meta">${escape(company.phone)} · ${escape(company.email)}${company.vatNumber ? ` · VAT: ${escape(company.vatNumber)}` : ''}</div>
  </div>
  <div style="text-align:right;">
    <div class="doctype">Receipt</div>
    <div style="font-size:18px;font-weight:800;margin-top:4px;">${escape(receipt.number)}</div>
    <div class="meta">For invoice ${escape(inv.number)}</div>
    <div class="meta">Date: ${formatDate(receipt.paymentDate)}</div>
  </div>
</div>

<div class="two">
  <div>
    <div class="lbl">Received from</div>
    <div style="font-size:14px;font-weight:700;">${escape(inv.customer.name)}</div>
    ${inv.customer.company ? `<div style="font-size:12px;color:#888;">${escape(inv.customer.company)}</div>` : ''}
  </div>
  <div style="text-align:right;">
    <div class="lbl">Amount</div>
    <div class="amt">${formatMoney(Number(receipt.amount))}</div>
    <div class="meta">Method: ${escape(receipt.method)}${receipt.reference ? ` · Ref: ${escape(receipt.reference)}` : ''}</div>
    <div style="margin-top:12px;"><span class="stamp">PAID</span></div>
  </div>
</div>

${receipt.notes ? `<div class="notes">${escape(receipt.notes)}</div>` : ''}

<div class="footer">
  <strong style="color:#111;">${escape(company.name)}</strong> · This is your proof of payment
</div>`

  return shell(`Receipt ${receipt.number} — ${company.name}`, body)
}
