import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  company: z.string().max(200).trim().optional().nullable(),
  email: z
    .string()
    .email()
    .max(200)
    .optional()
    .or(z.literal('').transform(() => null)),
  phone: z.string().max(50).trim().optional().nullable(),
  address: z.string().max(500).trim().optional().nullable(),
  notes: z.string().max(2000).trim().optional().nullable(),
})

export const productSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  category: z.string().max(100).trim().optional().nullable(),
  unitPrice: z.number().nonnegative().finite().max(10_000_000),
  description: z.string().max(2000).trim().optional().nullable(),
})

const lineItemSchema = z.object({
  productId: z.string().cuid().nullable(),
  description: z.string().min(1).max(500).trim(),
  qty: z.number().positive().finite().max(100_000),
  unitPrice: z.number().nonnegative().finite().max(10_000_000),
})

export const invoiceCreateSchema = z.object({
  customerId: z.string().cuid(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxRate: z.number().min(0).max(100).finite(),
  discount: z.number().min(0).max(100).finite(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['DRAFT', 'UNPAID']),
  items: z.array(lineItemSchema).min(1).max(200),
})

export const invoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'UNPAID', 'SENT', 'PAID']),
  paymentMethod: z.enum(['EFT', 'CARD', 'CASH', 'OTHER']).optional(),
  paymentReference: z.string().max(200).optional(),
})

export const userInviteSchema = z.object({
  email: z.string().email().max(200).toLowerCase().trim(),
  name: z.string().min(1).max(200).trim(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
  branch: z
    .string()
    .max(100)
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export const settingsSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  legalName: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional().or(z.literal('')),
  website: z.string().url().max(200).optional().or(z.literal('')),
  vatNumber: z.string().max(50).optional(),
  registrationNumber: z.string().max(50).optional(),
  // Accept either a regular http(s) URL or a `data:` URL (base64-embedded image).
  // Empty string is allowed and gets normalised to null in the API.
  logoUrl: z
    .string()
    .max(20_000)
    .refine(
      (v) => v === '' || /^(https?:\/\/|data:image\/)/i.test(v),
      'Must be an http(s) URL or a data:image/... URL',
    )
    .optional()
    .or(z.literal('')),
  taxRate: z.number().min(0).max(100).finite(),
  bankName: z.string().max(100).optional(),
  bankBranch: z.string().max(100).optional(),
  bankAccountName: z.string().max(200).optional(),
  bankAccountNumber: z.string().max(50).optional(),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12).max(200),
})
