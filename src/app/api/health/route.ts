import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Lightweight liveness + DB connectivity probe.
 *
 *   200 { status: 'ok',    db: 'ok',   smtp: 'configured' | 'not-configured' }
 *   503 { status: 'fail',  db: 'fail', reason: '<message>' }
 *
 * For uptime monitors (Better Stack, UptimeRobot) — does not require auth so
 * it can be polled from the public internet, but it returns NO secrets and
 * NO version info. Cache-Control prevents anything from caching the result.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  try {
    // 1 == cheapest possible round-trip; verifies the pg adapter has a live
    // connection. Don't query a real table — keeps the cost predictable.
    await prisma.$queryRaw`SELECT 1`
    const smtpConfigured = Boolean(
      process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        (process.env.SMTP_PASSWORD || process.env.SMTP_PASS),
    )
    return NextResponse.json(
      {
        status: 'ok',
        db: 'ok',
        smtp: smtpConfigured ? 'configured' : 'not-configured',
        durationMs: Date.now() - started,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    return NextResponse.json(
      {
        status: 'fail',
        db: 'fail',
        reason: err instanceof Error ? err.message : 'unknown',
        durationMs: Date.now() - started,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
