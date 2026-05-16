'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { formatMoney } from '@/lib/format'

type Product = { id: string; name: string; category: string | null; unitPrice: number }

export function ProductsClient({ initial }: { initial: Product[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', unitPrice: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, unitPrice: Number(form.unitPrice) }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Failed to save' }))
      return setError(msg)
    }
    setShowForm(false)
    setForm({ name: '', category: '', unitPrice: '' })
    router.refresh()
  }

  async function archive(id: string) {
    if (!confirm('Archive this product?')) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="bp-btn-primary">
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'New Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="bp-card p-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {error && (
            <div className="md:col-span-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="md:col-span-2">
            <label className="bp-label mb-1 block">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bp-input" />
          </div>
          <div>
            <label className="bp-label mb-1 block">Unit price (R) *</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              className="bp-input"
            />
          </div>
          <div className="md:col-span-3">
            <label className="bp-label mb-1 block">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bp-input"
              placeholder="Beds, Mattresses, Accessories…"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" disabled={saving} className="bp-btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save product
            </button>
          </div>
        </form>
      )}

      <div className="bp-card overflow-hidden">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th className="text-right">Unit price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {initial.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-gray-400">No products yet.</td></tr>
            )}
            {initial.map((p) => (
              <tr key={p.id}>
                <td className="font-bold">{p.name}</td>
                <td>{p.category ?? '—'}</td>
                <td className="text-right">{formatMoney(p.unitPrice)}</td>
                <td>
                  <button onClick={() => archive(p.id)} className="text-gray-400 hover:text-red-600" aria-label="Archive">
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
