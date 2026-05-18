'use client'

/**
 * Last-resort error boundary — catches errors thrown during root-layout render
 * (e.g. SessionProvider failure, fatal hydration mismatch). Renders its own
 * <html> + <body> because it replaces the entire page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", background: '#F6F6F6' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 13,
              boxShadow: '0 1px 4px rgba(0,0,0,.05)',
              padding: 32,
              maxWidth: 480,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
              <span style={{ color: '#E8191A' }}>Bed</span>
              <span style={{ color: '#111' }}>Pro</span>
            </div>
            <h1 style={{ marginTop: 24, fontSize: 22, fontWeight: 800 }}>Something went wrong</h1>
            <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
              We couldn&apos;t load the page. The error has been logged. Try again — and if it keeps
              happening, contact your administrator.
            </p>
            {error.digest && (
              <p style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>Reference: {error.digest}</p>
            )}
            <button
              onClick={() => reset()}
              style={{
                marginTop: 24,
                background: '#E8191A',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
