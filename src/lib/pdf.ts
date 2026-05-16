/**
 * Puppeteer wrapper for invoice/receipt PDFs.
 *
 *   - In production on Vercel we use @sparticuz/chromium + puppeteer-core
 *     because the full puppeteer chromium download (~170MB) blows the function
 *     size budget and Vercel's runtime has no system chrome.
 *   - In local dev (NODE_ENV !== 'production') we resolve the local puppeteer
 *     binary via dynamic import.
 */
type LaunchOptions = Parameters<typeof import('puppeteer-core').default.launch>[0]

async function getBrowser() {
  const puppeteerCore = (await import('puppeteer-core')).default

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default
    const options: LaunchOptions = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    }
    return puppeteerCore.launch(options)
  }

  // Local dev: fall back to the full puppeteer package's bundled chromium.
  const local = await import('puppeteer').then((m) => m.default)
  return local.launch({ headless: true })
}

export async function renderPdf(html: string): Promise<Uint8Array<ArrayBuffer>> {
  const browser = await getBrowser()
  try {
    const page = await browser.newPage()
    // domcontentloaded is enough — we inline all fonts/CSS, no network fetches needed for the template.
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    })
    // Force a fresh Uint8Array<ArrayBuffer> — Puppeteer returns
    // Uint8Array<ArrayBufferLike> which the strict Node 22+ DOM lib rejects
    // as BodyInit/BlobPart.
    const out = new Uint8Array(pdf.byteLength)
    out.set(pdf)
    return out
  } finally {
    await browser.close()
  }
}
