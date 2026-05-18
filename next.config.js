import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin Turbopack's workspace root to this directory so it doesn't try to walk
  // up and pick a different lockfile from C:\Users\neomo\.
  turbopack: { root: __dirname },
  // Native modules used server-side only — keep them out of the bundle.
  // In Next 15+ this is at the top level (not under `experimental`).
  serverExternalPackages: [
    '@sparticuz/chromium',
    'puppeteer-core',
    'puppeteer',
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    'bcryptjs',
  ],
  async headers() {
    // Permissive CSP suitable for an app that:
    //   - serves a small inline bootstrap script from Next.js itself
    //   - uses Tailwind (resolves to a real .css file, no inline <style>)
    //   - loads DM Sans from Google Fonts
    //   - displays logoUrl images (allowed for https + data: by validator)
    // Inline scripts are permitted because Next.js injects a runtime
    // bootstrap; tighten with nonces once you can afford the complexity.
    // Inline styles are permitted for icon SVGs and a few component styles.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
          // Strict-Transport-Security on prod over HTTPS — Vercel already
          // does this at the edge but explicit is safer.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default nextConfig
