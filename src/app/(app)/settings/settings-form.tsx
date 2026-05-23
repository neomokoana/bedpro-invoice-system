'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'

type Initial = {
  name: string
  legalName: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  vatNumber: string | null
  registrationNumber: string | null
  logoUrl: string | null
  taxRate: number
  bankName: string | null
  bankBranch: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
}

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: initial.name,
    legalName: initial.legalName ?? '',
    address: initial.address ?? '',
    phone: initial.phone ?? '',
    email: initial.email ?? '',
    website: initial.website ?? '',
    vatNumber: initial.vatNumber ?? '',
    registrationNumber: initial.registrationNumber ?? '',
    logoUrl: initial.logoUrl ?? '',
    taxRate: String(initial.taxRate),
    bankName: initial.bankName ?? '',
    bankBranch: initial.bankBranch ?? '',
    bankAccountName: initial.bankAccountName ?? '',
    bankAccountNumber: initial.bankAccountNumber ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Maps API field keys (camelCase) to the human-readable labels users see
  // in the form. Used to translate Zod `issues` into a useful error message.
  const FIELD_LABELS: Record<string, string> = {
    name: 'Display name',
    legalName: 'Legal name',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    vatNumber: 'VAT number',
    registrationNumber: 'Registration #',
    logoUrl: 'Logo',
    taxRate: 'Default VAT %',
    bankName: 'Bank',
    bankBranch: 'Branch',
    bankAccountName: 'Account name',
    bankAccountNumber: 'Account number',
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, taxRate: Number(form.taxRate) }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string
        issues?: Record<string, string[]>
      }
      // Zod errors from the API include per-field issues. Translate them to
      // "Field name: reason" lines so the user knows which input to fix —
      // a plain "Invalid input" toast leaves them guessing.
      if (body.issues && Object.keys(body.issues).length > 0) {
        const lines = Object.entries(body.issues)
          .filter(([, errs]) => errs && errs.length > 0)
          .map(
            ([field, errs]) =>
              `${FIELD_LABELS[field] ?? field}: ${errs.join('; ')}`,
          )
        return setError(lines.join('\n'))
      }
      return setError(body.error ?? 'Failed to save')
    }
    setSaved(true)
    router.refresh()
  }

  const fields: { key: keyof typeof form; label: string; type?: string; span?: number }[] = [
    { key: 'name', label: 'Display name', span: 2 },
    { key: 'legalName', label: 'Legal name', span: 2 },
    { key: 'address', label: 'Address', span: 2 },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'website', label: 'Website' },
    { key: 'vatNumber', label: 'VAT number' },
    { key: 'registrationNumber', label: 'Registration #' },
    { key: 'taxRate', label: 'Default VAT %', type: 'number' },
  ]

  const banking: { key: keyof typeof form; label: string }[] = [
    { key: 'bankName', label: 'Bank' },
    { key: 'bankBranch', label: 'Branch' },
    { key: 'bankAccountName', label: 'Account name' },
    { key: 'bankAccountNumber', label: 'Account number' },
  ]

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-line">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Settings saved.
        </div>
      )}

      <div className="bp-card p-6">
        <h2 className="font-bold mb-4">Company details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.key} className={f.span === 2 ? 'md:col-span-2' : ''}>
              <label className="bp-label mb-1 block">{f.label}</label>
              <input
                type={f.type ?? 'text'}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="bp-input"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bp-card p-6">
        <h2 className="font-bold mb-1">Logo</h2>
        <p className="text-xs text-gray-500 mb-4">
          Used on every invoice and receipt. Paste an image URL (https://…) or a{' '}
          <code className="text-[11px]">data:image/png;base64,…</code> URL. Leave blank to use the
          built-in &ldquo;BedPro&rdquo; text logo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-3 items-start">
          <input
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            className="bp-input"
            placeholder="https://example.com/bedpro-logo.png"
          />
          <div className="bp-card p-3 flex items-center justify-center h-[60px] bg-gray-50">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logoUrl}
                alt="Logo preview"
                className="max-h-[44px] w-auto"
                onError={(e) => ((e.currentTarget.style.display = 'none'))}
              />
            ) : (
              <span className="bp-logo text-[22px]">
                <span className="bp-logo-bed">Bed</span>
                <span className="bp-logo-pro">Pro</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bp-card p-6">
        <h2 className="font-bold mb-4">Banking (printed on invoices)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {banking.map((f) => (
            <div key={f.key}>
              <label className="bp-label mb-1 block">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="bp-input"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="bp-btn-primary">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save settings
        </button>
      </div>
    </form>
  )
}
