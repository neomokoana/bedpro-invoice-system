/**
 * Rate limiting hook.
 *
 * Today this is a stub that always allows the request — Vercel serverless has
 * no shared memory and we don't have Redis configured. Per-account lockout
 * (5 strikes / 15 minutes via users.failedLoginCount) is still in place and
 * covers the common case of brute-forcing one account.
 *
 * To enable per-IP rate limiting in production, install `@upstash/ratelimit`
 * and `@upstash/redis`, set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`,
 * and replace the body of `checkRateLimit` with:
 *
 *   import { Ratelimit } from '@upstash/ratelimit'
 *   import { Redis } from '@upstash/redis'
 *   const limiter = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(20, '15 m'),
 *     analytics: true,
 *   })
 *   export async function checkRateLimit(key: string) {
 *     const { success, reset, remaining } = await limiter.limit(key)
 *     return { ok: success, remaining, resetAt: new Date(reset) }
 *   }
 *
 * Call sites: /api/auth/[...nextauth]/route.ts (credentials POST handler),
 * /api/users POST (invite), /api/users/[id]/reset POST.
 */
export type RateLimitResult = {
  ok: boolean
  remaining?: number
  resetAt?: Date
}

export async function checkRateLimit(_key: string): Promise<RateLimitResult> {
  // No-op until Upstash is wired up.
  return { ok: true }
}

export function isRateLimitConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}
