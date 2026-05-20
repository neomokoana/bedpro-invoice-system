/**
 * PDF rendering via @react-pdf/renderer. Replaces the Puppeteer pipeline,
 * which was unreliable on Vercel (Chromium binary launch errors at runtime).
 *
 *   - Pure JS, no Chromium binary
 *   - ~3MB instead of ~50MB
 *   - Runs on any Node runtime; no special Vercel config needed
 *
 * Templates live in src/lib/invoice-pdf.tsx as React components.
 */
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

/**
 * Render a React-PDF Document to a binary Uint8Array suitable for an HTTP
 * response body or a Nodemailer attachment.
 */
export async function renderPdf(
  document: ReactElement<DocumentProps>,
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await renderToBuffer(document)
  // Force a fresh Uint8Array<ArrayBuffer> — Node's Buffer reports
  // Uint8Array<ArrayBufferLike> which the strict Node 22+ DOM lib rejects
  // as BodyInit/BlobPart.
  const out = new Uint8Array(buffer.byteLength)
  out.set(buffer)
  return out
}
