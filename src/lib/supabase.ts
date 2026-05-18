/**
 * Supabase clients.
 *
 *   - `supabasePublic`  — anon key, safe in the browser, RLS-bound.
 *   - `supabaseAdmin()` — service-role key, server-only, bypasses RLS.
 *                         Lazily instantiated so the key is never bundled
 *                         into a client component by accident.
 *
 * The database itself is accessed via Prisma. These clients are only for
 * Supabase-specific features: Storage (file uploads), Realtime, and (later)
 * Auth helpers if you ever want a magic-link flow.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabasePublic: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false }, // we use NextAuth, not Supabase Auth
      })
    : null

let cachedAdmin: SupabaseClient | null = null

/**
 * Server-only client with the service-role key. Bypasses RLS — use carefully
 * and only on the server (API routes, server components). Returns null if the
 * keys aren't configured.
 */
export function supabaseAdmin(): SupabaseClient | null {
  if (cachedAdmin) return cachedAdmin
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  cachedAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedAdmin
}

export async function uploadToBucket(args: {
  bucket: string
  path: string
  body: Buffer | Blob
  contentType?: string
  upsert?: boolean
}): Promise<{ publicUrl: string } | null> {
  const admin = supabaseAdmin()
  if (!admin) return null
  const { error } = await admin.storage.from(args.bucket).upload(args.path, args.body, {
    contentType: args.contentType,
    upsert: args.upsert ?? true,
  })
  if (error) {
    logger.error('supabase.upload_failed', { bucket: args.bucket, path: args.path }, error)
    return null
  }
  const { data } = admin.storage.from(args.bucket).getPublicUrl(args.path)
  return { publicUrl: data.publicUrl }
}
