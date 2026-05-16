'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, ShieldOff, ShieldCheck, RotateCw } from 'lucide-react'
import type { Role } from '@prisma/client'
import { formatDate } from '@/lib/format'

type Row = {
  id: string
  email: string
  name: string
  role: Role
  branch: string | null
  isActive: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}

export function UsersClient({ currentUserId, initial }: { currentUserId: string; initial: Row[] }) {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState<{ email: string; name: string; role: Role; branch: string }>({
    email: '',
    name: '',
    role: 'STAFF',
    branch: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Failed' }))
      return setError(msg)
    }
    const data = await res.json()
    setSuccess(
      data.emailed
        ? `Invite sent to ${form.email}. They have a temporary password and will be asked to set their own on first sign-in.`
        : `User created. Email could not be sent — share this temporary password securely with them: ${data.tempPassword}`,
    )
    setForm({ email: '', name: '', role: 'STAFF', branch: '' })
    setShow(false)
    router.refresh()
  }

  async function toggle(id: string, isActive: boolean) {
    if (id === currentUserId) return alert('You cannot deactivate yourself.')
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    if (res.ok) router.refresh()
  }

  async function resetPassword(id: string, email: string) {
    if (!confirm(`Reset password for ${email}? A new temporary password will be emailed.`)) return
    const res = await fetch(`/api/users/${id}/reset`, { method: 'POST' })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed' }))
      return setError(error)
    }
    const data = await res.json()
    setSuccess(
      data.emailed
        ? `Temporary password emailed to ${email}.`
        : `Email could not be sent. Temporary password: ${data.tempPassword}`,
    )
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShow(!show)
            setError(null)
            setSuccess(null)
          }}
          className="bp-btn-primary"
        >
          <Plus className="h-4 w-4" /> {show ? 'Cancel' : 'Invite User'}
        </button>
      </div>

      {success && <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

      {show && (
        <form onSubmit={invite} className="bp-card p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {error && (
            <div className="md:col-span-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="bp-label mb-1 block">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bp-input"
            />
          </div>
          <div>
            <label className="bp-label mb-1 block">Full name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bp-input" />
          </div>
          <div>
            <label className="bp-label mb-1 block">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="bp-input">
              <option value="STAFF">Staff — create invoices only</option>
              <option value="MANAGER">Manager — all invoices, no user management</option>
              <option value="ADMIN">Admin — full access</option>
            </select>
          </div>
          <div>
            <label className="bp-label mb-1 block">Branch</label>
            <input
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              className="bp-input"
              placeholder="Pretoria HQ"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="bp-btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Send invite
            </button>
          </div>
        </form>
      )}

      <div className="bp-card overflow-hidden">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Name / Email</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Last login</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {initial.map((u) => (
              <tr key={u.id} className={u.isActive ? '' : 'opacity-60'}>
                <td>
                  <div className="font-bold">
                    {u.name} {u.id === currentUserId && <span className="text-[10px] text-gray-400">(you)</span>}
                  </div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>
                <td>{u.role}</td>
                <td>{u.branch ?? '—'}</td>
                <td className="text-xs">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</td>
                <td>
                  {!u.isActive ? (
                    <span className="bp-badge bg-gray-100 text-gray-600 border border-gray-300">Deactivated</span>
                  ) : u.mustChangePassword ? (
                    <span className="bp-badge bg-yellow-100 text-yellow-700 border border-yellow-300">Pending first sign-in</span>
                  ) : (
                    <span className="bp-badge bg-emerald-100 text-emerald-700 border border-emerald-300">Active</span>
                  )}
                </td>
                <td className="space-x-1 whitespace-nowrap">
                  <button
                    onClick={() => resetPassword(u.id, u.email)}
                    className="bp-btn-ghost text-xs"
                    title="Email a new temp password"
                  >
                    <RotateCw className="h-3 w-3" /> Reset
                  </button>
                  {u.id !== currentUserId && (
                    <button onClick={() => toggle(u.id, u.isActive)} className="bp-btn-ghost text-xs">
                      {u.isActive ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
