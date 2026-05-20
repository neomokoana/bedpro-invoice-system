/**
 * Branded invoice + receipt PDF — rendered by @react-pdf/renderer, no
 * Chromium binary required. Drop-in replacement for the previous Puppeteer
 * pipeline so the same data shapes still work.
 *
 * Bed Pro branding (#E8191A / #111, DM Sans bold) is preserved via
 * primitive styles. Footer carries www.bedpro.org.za on every page.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  type DocumentProps,
} from '@react-pdf/renderer'
import type { Invoice, InvoiceItem, Customer, CompanySettings, Receipt } from '@prisma/client'
import { formatMoney, formatDate } from './format'

const RED = '#E8191A'
const BLACK = '#111111'
const MUTED = '#777777'
const MUTED_LIGHT = '#aaaaaa'
const BORDER = '#f0f0f0'
const BRAND_WEBSITE = 'www.bedpro.org.za'

// React-PDF doesn't ship with DM Sans, and registering Google Fonts at
// runtime adds an HTTP fetch from every PDF render which is exactly the kind
// of unreliability we just eliminated. Helvetica is the built-in default and
// renders crisply at any size — close enough to DM Sans for invoicing.
const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, fontSize: 11, color: BLACK, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 3,
    borderBottomColor: RED,
    paddingBottom: 16,
    marginBottom: 22,
  },
  logoWrap: { flexDirection: 'row', alignItems: 'baseline' },
  logoBed: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: RED, letterSpacing: -1 },
  logoPro: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: BLACK, letterSpacing: -1 },
  meta: { fontSize: 9, color: MUTED_LIGHT, marginTop: 3 },
  rightCol: { alignItems: 'flex-end' },
  docType: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: RED, letterSpacing: 2 },
  docNumber: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 3 },

  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  lbl: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#bbbbbb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  amount: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: RED },
  custName: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  custCompany: { fontSize: 10, color: MUTED, marginTop: 1 },
  custMeta: { fontSize: 9, color: MUTED_LIGHT, marginTop: 6, lineHeight: 1.5 },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: BLACK, color: 'white', paddingVertical: 7, paddingHorizontal: 8 },
  th: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, textTransform: 'uppercase', color: 'white' },
  thDesc: { flex: 4 },
  thQty: { flex: 1, textAlign: 'right' },
  thPrice: { flex: 1.5, textAlign: 'right' },
  thTotal: { flex: 1.5, textAlign: 'right' },
  tr: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  td: { fontSize: 10 },
  tdDesc: { flex: 4 },
  tdQty: { flex: 1, textAlign: 'right' },
  tdPrice: { flex: 1.5, textAlign: 'right' },
  tdTotal: { flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  // Totals
  totals: { marginTop: 14, marginLeft: 'auto', width: 240 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  totalLabel: { fontSize: 10, color: MUTED },
  totalValue: { fontSize: 10, color: BLACK },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 2 },
  grandLabel: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  grandValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: RED },

  // Notes
  notes: { marginTop: 18, padding: 10, backgroundColor: '#fafafa', borderLeftWidth: 3, borderLeftColor: RED, fontSize: 10, color: MUTED },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 8,
    alignItems: 'center',
  },
  footerLine: { fontSize: 9, color: '#bbbbbb' },
  footerStrong: { fontFamily: 'Helvetica-Bold', color: BLACK },
  brandUrl: { fontSize: 8, color: '#cccccc', marginTop: 3 },

  // PAID stamp (used on invoice when status=PAID and on every receipt)
  stamp: {
    borderWidth: 3,
    borderColor: '#16a34a',
    color: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
})

function BrandHeader({ company }: { company: CompanySettings }) {
  return (
    <View style={styles.logoWrap}>
      <Text style={styles.logoBed}>Bed</Text>
      <Text style={styles.logoPro}>Pro</Text>
    </View>
  )
}

function Footer({ company }: { company: CompanySettings }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerLine}>
        <Text style={styles.footerStrong}>{company.name}</Text>
        {company.address ? ` · ${company.address}` : ''}
      </Text>
      <Text style={styles.brandUrl}>{BRAND_WEBSITE}</Text>
    </View>
  )
}

// ────────────────────────────────────────────────────────────────
// Invoice
// ────────────────────────────────────────────────────────────────
export function InvoiceDocument({
  invoice,
  company,
}: {
  invoice: Invoice & { items: InvoiceItem[]; customer: Customer }
  company: CompanySettings
}): React.ReactElement<DocumentProps> {
  const isPaid = invoice.status === 'PAID'

  const subtotal = Number(invoice.subtotal)
  const discountAmt = Number(invoice.discountAmt)
  const taxAmount = Number(invoice.taxAmount)
  const total = Number(invoice.total)
  const taxRate = Number(invoice.taxRate)
  const discount = Number(invoice.discount)

  return (
    <Document
      title={`Invoice ${invoice.number} — ${company.name}`}
      author={company.name}
      subject={`Invoice for ${invoice.customer.name}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <BrandHeader company={company} />
            {company.address ? <Text style={styles.meta}>{company.address}</Text> : null}
            {(company.phone || company.email) ? (
              <Text style={styles.meta}>
                {[company.phone, company.email, company.vatNumber ? `VAT: ${company.vatNumber}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.docType}>INVOICE</Text>
            <Text style={styles.docNumber}>{invoice.number}</Text>
            <Text style={styles.meta}>Issue: {formatDate(invoice.issueDate)}</Text>
            <Text style={styles.meta}>Due: {formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Bill to + amount */}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>Bill to</Text>
            <Text style={styles.custName}>{invoice.customer.name}</Text>
            {invoice.customer.company ? (
              <Text style={styles.custCompany}>{invoice.customer.company}</Text>
            ) : null}
            <Text style={styles.custMeta}>
              {[invoice.customer.email, invoice.customer.phone, invoice.customer.address]
                .filter(Boolean)
                .join('\n')}
            </Text>
          </View>
          <View style={[styles.rightCol, { flex: 1 }]}>
            <Text style={styles.lbl}>{isPaid ? 'Total Paid' : 'Amount Due'}</Text>
            <Text style={styles.amount}>{formatMoney(total)}</Text>
            <Text style={styles.meta}>
              {isPaid ? 'Paid in full' : `Due by ${formatDate(invoice.dueDate)}`}
            </Text>
            {isPaid ? <Text style={styles.stamp}>PAID</Text> : null}
          </View>
        </View>

        {/* Line items */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.thDesc]}>Description</Text>
          <Text style={[styles.th, styles.thQty]}>Qty</Text>
          <Text style={[styles.th, styles.thPrice]}>Unit Price</Text>
          <Text style={[styles.th, styles.thTotal]}>Total</Text>
        </View>
        {invoice.items.map((i) => (
          <View key={i.id} style={styles.tr} wrap={false}>
            <Text style={[styles.td, styles.tdDesc]}>{i.description}</Text>
            <Text style={[styles.td, styles.tdQty]}>{Number(i.qty)}</Text>
            <Text style={[styles.td, styles.tdPrice]}>{formatMoney(Number(i.unitPrice))}</Text>
            <Text style={[styles.td, styles.tdTotal]}>{formatMoney(Number(i.lineTotal))}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatMoney(subtotal)}</Text>
          </View>
          {discountAmt > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount ({discount}%)</Text>
              <Text style={styles.totalValue}>−{formatMoney(discountAmt)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT ({taxRate}%)</Text>
            <Text style={styles.totalValue}>{formatMoney(taxAmount)}</Text>
          </View>
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>TOTAL DUE</Text>
            <Text style={styles.grandValue}>{formatMoney(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes ? (
          <View style={styles.notes}>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* Banking */}
        {(company.bankName || company.bankAccountName || company.bankAccountNumber) ? (
          <View style={styles.notes}>
            {company.bankName ? <Text><Text style={{ fontFamily: 'Helvetica-Bold' }}>BANK: </Text>{company.bankName}</Text> : null}
            {company.bankBranch ? <Text><Text style={{ fontFamily: 'Helvetica-Bold' }}>BRANCH: </Text>{company.bankBranch}</Text> : null}
            {company.bankAccountName ? <Text><Text style={{ fontFamily: 'Helvetica-Bold' }}>ACCOUNT: </Text>{company.bankAccountName}</Text> : null}
            {company.bankAccountNumber ? <Text><Text style={{ fontFamily: 'Helvetica-Bold' }}>ACC NO: </Text>{company.bankAccountNumber}</Text> : null}
          </View>
        ) : null}

        <Footer company={company} />
      </Page>
    </Document>
  )
}

// ────────────────────────────────────────────────────────────────
// Receipt
// ────────────────────────────────────────────────────────────────
export function ReceiptDocument({
  receipt,
  company,
}: {
  receipt: Receipt & { invoice: Invoice & { customer: Customer } }
  company: CompanySettings
}): React.ReactElement<DocumentProps> {
  const inv = receipt.invoice
  return (
    <Document
      title={`Receipt ${receipt.number} — ${company.name}`}
      author={company.name}
      subject={`Receipt for ${inv.customer.name}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <BrandHeader company={company} />
            {company.address ? <Text style={styles.meta}>{company.address}</Text> : null}
            {(company.phone || company.email) ? (
              <Text style={styles.meta}>
                {[company.phone, company.email, company.vatNumber ? `VAT: ${company.vatNumber}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.docType}>RECEIPT</Text>
            <Text style={styles.docNumber}>{receipt.number}</Text>
            <Text style={styles.meta}>For invoice {inv.number}</Text>
            <Text style={styles.meta}>Date: {formatDate(receipt.paymentDate)}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>Received from</Text>
            <Text style={styles.custName}>{inv.customer.name}</Text>
            {inv.customer.company ? (
              <Text style={styles.custCompany}>{inv.customer.company}</Text>
            ) : null}
          </View>
          <View style={[styles.rightCol, { flex: 1 }]}>
            <Text style={styles.lbl}>Amount</Text>
            <Text style={styles.amount}>{formatMoney(Number(receipt.amount))}</Text>
            <Text style={styles.meta}>
              Method: {receipt.method}
              {receipt.reference ? ` · Ref: ${receipt.reference}` : ''}
            </Text>
            <Text style={styles.stamp}>PAID</Text>
          </View>
        </View>

        {receipt.notes ? (
          <View style={styles.notes}>
            <Text>{receipt.notes}</Text>
          </View>
        ) : null}

        <Footer company={company} />
      </Page>
    </Document>
  )
}
