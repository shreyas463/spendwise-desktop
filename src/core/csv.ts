/**
 * CSV import: RFC 4180 parsing plus heuristic detection of bank-statement
 * formats (column roles, date format, amount conventions).
 */
import { isValidYmd, monthIndexFromName, toIso } from './dates'

export interface ParsedCsv {
  headers: string[]
  rows: string[][]
  delimiter: string
}

export interface NormalizedRow {
  date: string // ISO yyyy-mm-dd
  description: string
  amount: number
  account?: string
}

export interface CsvImport {
  rows: NormalizedRow[]
  /** Row numbers (1-based, excluding header) that could not be parsed */
  skipped: { line: number; reason: string }[]
  mapping: {
    date: string
    description: string
    amount: string
    dateFormat: 'MDY' | 'DMY' | 'ISO' | 'text'
  }
}

/** Pick the delimiter that yields the most consistent multi-column split. */
function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/, 10).filter((l) => l.trim().length > 0)
  let best = ','
  let bestScore = -1
  for (const d of [',', ';', '\t', '|']) {
    const counts = sample.map((l) => splitLine(l, d).length)
    const cols = counts[0] ?? 0
    if (cols < 2) continue
    const consistent = counts.every((c) => c === cols)
    const score = (consistent ? 1000 : 0) + cols
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return best
}

/** Split a single line honoring quotes (used only for delimiter detection). */
function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

/** Full RFC 4180 parser: quoted fields may contain delimiters and newlines. */
export function parseCsv(text: string, delimiter?: string): ParsedCsv {
  const clean = text.replace(/^\uFEFF/, '')
  const d = delimiter ?? detectDelimiter(clean)
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuotes = false
  let sawAny = false

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') {
      inQuotes = true
      sawAny = true
    } else if (ch === d) {
      row.push(cur)
      cur = ''
      sawAny = true
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      if (sawAny || cur.length > 0) {
        row.push(cur)
        rows.push(row)
      }
      row = []
      cur = ''
      sawAny = false
    } else {
      cur += ch
      sawAny = true
    }
  }
  if (sawAny || cur.length > 0) {
    row.push(cur)
    rows.push(row)
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim().length > 0))
  const headers = (nonEmpty[0] ?? []).map((h) => h.trim())
  return { headers, rows: nonEmpty.slice(1), delimiter: d }
}

/**
 * Parse a money string. Handles "$1,234.56", "(45.00)" and trailing-minus
 * negatives, "1.234,56" European style, and bare numbers.
 */
export function parseAmount(raw: string): number | null {
  let s = raw.trim()
  if (!s) return null
  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1)
  }
  if (s.endsWith('-')) {
    negative = true
    s = s.slice(0, -1)
  }
  if (s.startsWith('-')) {
    negative = true
    s = s.slice(1)
  }
  if (s.startsWith('+')) s = s.slice(1)
  s = s.replace(/[^\d.,]/g, '')
  if (!s || !/\d/.test(s)) return null

  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastDot >= 0 && lastComma >= 0) {
    // Whichever separator comes last is the decimal point
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (lastComma >= 0) {
    // "12,34" → decimal comma; "1,234" → thousands separator
    const decimals = s.length - lastComma - 1
    if (decimals === 3 && s.length > 4) s = s.replace(/,/g, '')
    else s = s.replace(',', '.')
  }
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return negative ? -n : n
}

const TEXT_DATE =
  /^(\d{1,2})?\s*([a-zA-Z]{3,9})\.?,?\s+(\d{1,2})?,?\s*(\d{4})$/

/** Parse one date string given a resolved numeric convention. */
export function parseDate(raw: string, format: 'MDY' | 'DMY' | 'ISO' | 'text'): string | null {
  const s = raw.trim()
  if (!s) return null

  const iso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (iso) {
    const [, y, m, d] = iso.map(Number)
    return isValidYmd(y, m, d) ? toIso(y, m, d) : null
  }

  const num = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)
  if (num) {
    const [, a, b] = num.map(Number)
    let y = Number(num[3])
    if (y < 100) y += y >= 70 ? 1900 : 2000
    const [m, d] = format === 'DMY' ? [b, a] : [a, b]
    return isValidYmd(y, m, d) ? toIso(y, m, d) : null
  }

  // "Jan 5, 2024" / "5 Jan 2024" / "March 15 2024"
  const t = s.match(TEXT_DATE)
  if (t) {
    const m = monthIndexFromName(t[2])
    const day = Number(t[1] ?? t[3])
    const y = Number(t[4])
    if (m && day && isValidYmd(y, m, day)) return toIso(y, m, day)
  }
  return null
}

/**
 * Decide MDY vs DMY by scanning all values: if any first component exceeds
 * 12 the file is day-first; if any second component exceeds 12 it is
 * month-first. Defaults to MDY (the most common bank export convention).
 */
export function inferDateFormat(values: string[]): 'MDY' | 'DMY' | 'ISO' | 'text' {
  let sawNumeric = false
  let dmy = false
  let mdy = false
  for (const v of values) {
    const s = v.trim()
    if (/^\d{4}[-/.]/.test(s)) return 'ISO'
    const m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.]\d{2,4}$/)
    if (m) {
      sawNumeric = true
      if (Number(m[1]) > 12) dmy = true
      if (Number(m[2]) > 12) mdy = true
    } else if (TEXT_DATE.test(s)) {
      return 'text'
    }
  }
  if (!sawNumeric) return 'text'
  if (dmy && !mdy) return 'DMY'
  return 'MDY'
}

const DATE_HEADERS = ['date', 'transaction date', 'posted date', 'posting date', 'trans date', 'value date', 'booking date']
const DESC_HEADERS = ['description', 'details', 'memo', 'payee', 'name', 'narrative', 'transaction', 'merchant', 'reference']
const AMOUNT_HEADERS = ['amount', 'transaction amount', 'amount (usd)', 'value']
const DEBIT_HEADERS = ['debit', 'withdrawal', 'withdrawals', 'money out', 'paid out', 'outflow']
const CREDIT_HEADERS = ['credit', 'deposit', 'deposits', 'money in', 'paid in', 'inflow']
const ACCOUNT_HEADERS = ['account', 'account name', 'card', 'account number']

function findHeader(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim())
  for (const c of candidates) {
    const exact = lower.indexOf(c)
    if (exact >= 0) return exact
  }
  for (const c of candidates) {
    const partial = lower.findIndex((h) => h.includes(c))
    if (partial >= 0) return partial
  }
  return -1
}

/**
 * Normalize an arbitrary bank CSV export into {date, description, amount}
 * rows. Supports single signed-amount columns as well as debit/credit pairs.
 * Throws with a human-readable message when required columns are missing.
 */
export function importCsv(text: string): CsvImport {
  const { headers, rows } = parseCsv(text)
  if (headers.length < 2 || rows.length === 0) {
    throw new Error('This file does not look like a CSV export — it needs a header row and at least one transaction.')
  }

  const dateCol = findHeader(headers, DATE_HEADERS)
  const descCol = findHeader(headers, DESC_HEADERS)
  const amountCol = findHeader(headers, AMOUNT_HEADERS)
  const debitCol = findHeader(headers, DEBIT_HEADERS)
  const creditCol = findHeader(headers, CREDIT_HEADERS)
  const accountCol = findHeader(headers, ACCOUNT_HEADERS)

  if (dateCol < 0) throw new Error(`Could not find a date column. Headers found: ${headers.join(', ')}`)
  if (descCol < 0) throw new Error(`Could not find a description column. Headers found: ${headers.join(', ')}`)
  if (amountCol < 0 && debitCol < 0 && creditCol < 0) {
    throw new Error(`Could not find an amount column (or debit/credit columns). Headers found: ${headers.join(', ')}`)
  }

  const dateFormat = inferDateFormat(rows.map((r) => r[dateCol] ?? ''))
  const out: NormalizedRow[] = []
  const skipped: { line: number; reason: string }[] = []

  rows.forEach((r, i) => {
    const line = i + 1
    const date = parseDate(r[dateCol] ?? '', dateFormat)
    if (!date) {
      skipped.push({ line, reason: `Unrecognized date "${r[dateCol] ?? ''}"` })
      return
    }
    const description = (r[descCol] ?? '').trim()
    if (!description) {
      skipped.push({ line, reason: 'Empty description' })
      return
    }

    let amount: number | null = null
    if (amountCol >= 0 && (r[amountCol] ?? '').trim()) {
      amount = parseAmount(r[amountCol])
    } else {
      const debit = debitCol >= 0 ? parseAmount(r[debitCol] ?? '') : null
      const credit = creditCol >= 0 ? parseAmount(r[creditCol] ?? '') : null
      if (debit !== null && debit !== 0) amount = -Math.abs(debit)
      else if (credit !== null && credit !== 0) amount = Math.abs(credit)
    }
    if (amount === null) {
      skipped.push({ line, reason: 'Missing or unreadable amount' })
      return
    }

    out.push({
      date,
      description,
      amount: Math.round(amount * 100) / 100,
      account: accountCol >= 0 ? (r[accountCol] ?? '').trim() || undefined : undefined,
    })
  })

  return {
    rows: out,
    skipped,
    mapping: {
      date: headers[dateCol],
      description: headers[descCol],
      amount: amountCol >= 0 ? headers[amountCol] : `${headers[debitCol] ?? ''}/${headers[creditCol] ?? ''}`,
      dateFormat,
    },
  }
}

/** Stable key used to detect duplicate imports. */
export function txKey(date: string, amount: number, description: string): string {
  return `${date}|${amount.toFixed(2)}|${description.toLowerCase().replace(/\s+/g, ' ').trim()}`
}

/** Serialize rows back to CSV (used by exports). */
export function toCsv(columns: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}
