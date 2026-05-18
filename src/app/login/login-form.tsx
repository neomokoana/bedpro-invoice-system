'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

const DEFAULT_ERROR = 'Could not sign in. Please try again.'
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password.',
  ACCOUNT_DISABLED: 'This account has been deactivated. Contact your administrator.',
  ACCOUNT_LOCKED: 'Too many failed attempts. Try again in 15 minutes.',
}

function errorFor(code: string | undefined | null): string {
  if (!code) return DEFAULT_ERROR
  return ERROR_MESSAGES[code] ?? DEFAULT_ERROR
}

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl?: string
  initialError?: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(initialError ? errorFor(initialError) : null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl ?? '/dashboard',
    })
    setLoading(false)

    if (!res) return setError(DEFAULT_ERROR)
    if (res.error) return setError(errorFor(res.error))

    router.push(res.url ?? '/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="bp-label mb-1 block">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bp-input"
          placeholder="you@bedpro.co.za"
        />
      </div>

      <div>
        <label htmlFor="password" className="bp-label mb-1 block">Password</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bp-input pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            onClick={() => setShowPw(!showPw)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-gray-400">
        Signing in keeps you logged in for 30 days on this device.
      </p>

      <button type="submit" className="bp-btn-primary w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>
    </form>
  )
}
