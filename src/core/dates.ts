/** Minimal date helpers over ISO yyyy-mm-dd strings — no library needed. */

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

export function isValidYmd(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/** "2024-03" from "2024-03-15" */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** Human label "Mar 2024" for a month key "2024-03" */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const name = MONTH_NAMES[m - 1] ?? ''
  return `${name.slice(0, 1).toUpperCase()}${name.slice(1, 3)} ${y}`
}

export function todayIso(now = new Date()): string {
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
}

/** Month key shifted by delta months. shiftMonth("2024-01", -1) === "2023-12" */
export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${ny}-${pad2(nm)}`
}

/** Inclusive list of month keys from `from` to `to`. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = []
  let cur = from
  while (cur <= to && out.length < 600) {
    out.push(cur)
    cur = shiftMonth(cur, 1)
  }
  return out
}

/** Last day (inclusive ISO range) of a month key. */
export function monthBounds(key: string): { start: string; end: string } {
  const [y, m] = key.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { start: `${key}-01`, end: `${key}-${pad2(lastDay)}` }
}

export function monthIndexFromName(word: string): number | null {
  const w = word.toLowerCase()
  const idx = MONTH_NAMES.findIndex((m) => m === w || m.slice(0, 3) === w.slice(0, 3))
  return idx >= 0 && (w.length >= 3) ? idx + 1 : null
}
