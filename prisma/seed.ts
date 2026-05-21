/**
 * Seed script — runs on first deploy.
 *
 *   pnpm db:seed
 *
 * Creates:
 *   - CompanySettings (singleton row)
 *   - First ADMIN user from SEED_ADMIN_* env vars
 *   - The Bed Pro product catalogue used by the demo
 *
 * Idempotent: safe to re-run. Existing rows are not overwritten.
 */
import 'dotenv/config'
import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! })
const prisma = new PrismaClient({ adapter })

const PRODUCTS = [
  { name: 'King Size Bed Frame', unitPrice: 4999, category: 'Beds' },
  { name: 'Queen Size Bed Frame', unitPrice: 3499, category: 'Beds' },
  { name: 'Single Bed Frame', unitPrice: 1999, category: 'Beds' },
  { name: 'Orthopaedic Mattress (King)', unitPrice: 6999, category: 'Mattresses' },
  { name: 'Memory Foam Mattress (Queen)', unitPrice: 4999, category: 'Mattresses' },
  { name: 'Pillow-Top Mattress (Single)', unitPrice: 2999, category: 'Mattresses' },
  { name: 'Delivery & Assembly', unitPrice: 450, category: 'Services' },
  { name: 'Upholstered Headboard', unitPrice: 1850, category: 'Accessories' },
  { name: 'Bedside Table', unitPrice: 899, category: 'Accessories' },
  { name: 'Mattress Protector', unitPrice: 349, category: 'Accessories' },
]

async function main() {
  await prisma.companySettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: 'Bed Pro',
      legalName: 'Bed Pro (Pty) Ltd',
      address: '47 Furniture Avenue, Pretoria, Gauteng, 0001',
      phone: '012 345 6789',
      email: 'info@bedpro.org.za',
      vatNumber: '4130456789',
      currency: 'ZAR',
      taxRate: 15,
    },
  })
  console.log('✓ Company settings ensured')

  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  const name = process.env.SEED_ADMIN_NAME ?? 'Bed Pro Admin'

  if (!email || !password) {
    console.warn(
      '⚠ Skipping admin seed — set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars to create one.',
    )
  } else {
    if (password.length < 12) {
      throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters long.')
    }
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
        mustChangePassword: false,
      },
    })
    console.log(`✓ Admin user ${email} ensured`)
  }

  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: `seed-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
      update: {},
      create: {
        id: `seed-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: p.name,
        category: p.category,
        unitPrice: p.unitPrice,
      },
    })
  }
  console.log(`✓ ${PRODUCTS.length} products ensured`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
