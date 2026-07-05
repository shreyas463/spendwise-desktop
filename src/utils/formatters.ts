/** Display helpers used across pages. */

export function formatCurrency(amount: number, currency = 'USD', opts: { signed?: boolean } = {}): string {
  const abs = Math.abs(amount)
  let s: string
  try {
    s = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(abs)
  } catch {
    s = `$${abs.toFixed(2)}`
  }
  if (opts.signed) return amount < 0 ? `−${s}` : `+${s}`
  return amount < 0 ? `−${s}` : s
}

/** "2024-03-15" → "Mar 15, 2024" without timezone pitfalls. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(1)}k`
  return `$${Math.round(amount)}`
}
