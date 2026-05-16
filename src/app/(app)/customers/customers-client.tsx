'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'

type Customer = {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  address: string | null
}

export function CustomersClient({ initial }: { initial: Customer[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Failed to save' }))
      return setError(msg)
    }
    setShowForm(false)
    setForm({ name: '', company: '', email: '', phone: '', address: '' })
    router.refresh()
  }

  async function archive(id: string) {
    if (!confirm('Archive this customer? Their existing invoices will be kept.')) return
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="bp-btn-primary">
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'New Customer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="bp-card p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {error && (
            <div className="md:col-span-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="bp-label mb-1 block">Full name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bp-input" />
          </div>
          <div>
            <label className="bp-label mb-1 block">Company</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bp-input" />
          </div>
          <div>
            <label className="bp-label mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bp-input" />
          </div>
          <div>
            <label className="bp-label mb-1 block">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bp-input" />
          </div>
          <div className="md:col-span-2">
            <label className="bp-label mb-1 block">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bp-input" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="bp-btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save customer
            </button>
          </div>
        </form>
      )}

      <div className="bp-card overflow-hidden">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {initial.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">No customers yet.</td></tr>
            )}
            {initial.map((c) => (
              <tr key={c.id}>
                <td className="font-bold">{c.name}</td>
                <td>{c.company ?? '—'}</td>
                <td>{c.email ?? '—'}</td>
                <td>{c.phone ?? '—'}</td>
                <td>
                  <button onClick={() => archive(c.id)} className="text-gray-400 hover:text-red-600" aria-label="Archive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
