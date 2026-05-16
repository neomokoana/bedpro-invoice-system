/**
 * Atomic sequence allocator. Uses CompanySettings.{invoiceCounter|receiptCounter}
 * incremented inside the same transaction as the row insert so two concurrent
 * creates cannot produce duplicate numbers.
 */
import type { Prisma } from '@prisma/client'

export async function nextInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const s = await tx.companySettings.update({
    where: { id: 'singleton' },
    data: { invoiceCounter: { increment: 1 } },
    select: { invoicePrefix: true, invoiceCounter: true },
  })
  return `${s.invoicePrefix}${String(s.invoiceCounter).padStart(4, '0')}`
}

export async function nextReceiptNumber(tx: Prisma.TransactionClient): Promise<string> {
  const s = await tx.companySettings.update({
    where: { id: 'singleton' },
    data: { receiptCounter: { increment: 1 } },
    select: { receiptPrefix: true, receiptCounter: true },
  })
  return `${s.receiptPrefix}${String(s.receiptCounter).padStart(4, '0')}`
}
