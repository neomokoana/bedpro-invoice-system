/**
 * One-off: load a PNG/SVG from disk, base64-encode, and write it to
 * CompanySettings.logoUrl as a data URL.
 *
 * Usage:
 *   node scripts/set-logo.mjs "<path-to-logo>"
 *   # or unset:
 *   node scripts/set-logo.mjs --clear
 *
 * Reads DATABASE_URL/DIRECT_URL from .env. Uses the direct connection.
 */
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

const arg = process.argv[2]
if (!arg) {
  console.error('Usage: node scripts/set-logo.mjs <path-to-image>  |  --clear')
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL })
const prisma = new PrismaClient({ adapter })

try {
  let logoUrl = null
  if (arg !== '--clear') {
    const ext = extname(arg).toLowerCase()
    const mime = MIME[ext]
    if (!mime) {
      throw new Error(`Unsupported file extension: ${ext}. Use png/jpg/svg/webp/gif.`)
    }
    const bytes = readFileSync(arg)
    logoUrl = `data:${mime};base64,${bytes.toString('base64')}`
    console.log(`Encoded ${bytes.byteLength} bytes → ${logoUrl.length} chars data URL`)
  }
  const updated = await prisma.companySettings.update({
    where: { id: 'singleton' },
    data: { logoUrl },
    select: { id: true, logoUrl: true },
  })
  console.log(
    logoUrl
      ? `✓ logoUrl set on company_settings (${updated.logoUrl?.length} chars)`
      : '✓ logoUrl cleared',
  )
} catch (e) {
  console.error('Failed:', e)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
