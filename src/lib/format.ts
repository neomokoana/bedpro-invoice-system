export function formatMoney(value: unknown, currency = 'R'): string {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (!Number.isFinite(n)) return `${currency} 0.00`
  return `${currency} ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ''
  const d =
    typeof value === 'string' ? new Date(value.slice(0, 10) + 'T00:00:00') : new Date(value)
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toISOString().slice(0, 10)
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
