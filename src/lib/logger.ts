/**
 * Tiny structured logger.
 *
 * Vercel captures stdout — emitting JSON lines makes them queryable in the
 * Vercel logs UI and easily ingested by Logtail/Datadog/Better Stack later.
 *
 *   logger.info('invoice.create', { userId, invoiceId })
 *   logger.error('email.send.failed', { messageId }, err)
 *
 * For full APM (request tracing, error grouping) bolt Sentry on top — see
 * the SENTRY_DSN env var.
 */
type Level = 'debug' | 'info' | 'warn' | 'error'
type Context = Record<string, unknown>

function emit(level: Level, event: string, ctx?: Context, err?: unknown) {
  const entry: Context = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(ctx ?? {}),
  }
  if (err !== undefined) {
    if (err instanceof Error) {
      entry.error = { name: err.name, message: err.message, stack: err.stack }
    } else {
      entry.error = err
    }
  }
  // One JSON line per record — easy to ingest by log shippers.
  const line = JSON.stringify(entry)
  if (level === 'error' || level === 'warn') {
    console.error(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  debug: (event: string, ctx?: Context) => {
    if (process.env.NODE_ENV === 'development') emit('debug', event, ctx)
  },
  info: (event: string, ctx?: Context) => emit('info', event, ctx),
  warn: (event: string, ctx?: Context) => emit('warn', event, ctx),
  error: (event: string, ctx?: Context, err?: unknown) => emit('error', event, ctx, err),
}
