'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export function SetPasswordForm() {
  const router = useRouter()
  const { update } = useSession()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate(): string | null {
    if (next.length < 12) return 'New password must be at least 12 characters.'
    if (!/[a-z]/.test(next) || !/[A-Z]/.test(next) || !/[0-9]/.test(next))
      return 'Use upper and lower case letters and at least one number.'
    if (next === current) return 'New password must differ from the temporary one.'
    if (next !== confirm) return 'Passwords do not match.'
    return null
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const v = validate()
    if (v) return setError(v)

    setLoading(true)
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    setLoading(false)

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Could not update password.' }))
      return setError(msg ?? 'Could not update password.')
    }

    await update({ mustChangePassword: false })
    router.push('/dashboard')
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
        <label className="bp-label mb-1 block">Current (temporary) password</label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="bp-input"
        />
      </div>

      <div>
        <label className="bp-label mb-1 block">New password</label>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="bp-input"
        />
        <p className="mt-1 text-[11px] text-gray-500">
          At least 12 characters, with upper, lower and a number.
        </p>
      </div>

      <div>
        <label className="bp-label mb-1 block">Confirm new password</label>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="bp-input"
        />
      </div>

      <button type="submit" className="bp-btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Save and continue
      </button>
    </form>
  )
}
