'use client'

/**
 * Route-level error boundary — catches errors thrown inside the (app) tree.
 * Renders inside the root layout so the sidebar/header are still visible.
 */
import { useEffect } from 'react'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Send to Sentry/equivalent once wired up. For now, server-side errors
    // are already logged by the API; this catches client-render exceptions.
    console.error('[app-error]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bp-card p-8 max-w-md text-center">
        <h1 className="text-2xl font-extrabold">Something went wrong</h1>
        <p className="text-sm text-gray-500 mt-2">
          We couldn&apos;t load this page. The error has been logged.
        </p>
        {error.digest && (
          <p className="text-[11px] text-gray-400 mt-2">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex gap-2 justify-center">
          <button onClick={() => reset()} className="bp-btn-primary">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link href="/dashboard" className="bp-btn-outline">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
