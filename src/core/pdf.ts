/**
 * PDF bank/credit-card statement parsing.
 *
 * This module is PURE: it takes the already-extracted text of a statement
 * (one string per visual line, produced by src/services/pdfExtract.ts) and
 * returns the same {date, description, amount} rows that the CSV importer
 * produces — so PDFs flow through the identical categorize → dedup → store
 * pipeline. Keeping it text-only makes the hard part (deciding which lines
 * are real transactions) unit-testable without a PDF engine.
 *
 * Statements are semi-structured free text, so the goal is to keep ONLY the
 * relevant rows — a line is treated as a transaction when it has a leading
 * date and at least one trailing money amount. Everything else (addresses,
 * headers, page numbers, marketing, running totals) is dropped.
 */
import { NormalizedRow } from './csv'
import { inferDateFormat, parseDate } from './csv'
import { isValidYmd, monthIndexFromName, toIso } from './dates'

export interface PdfParseResult {
  rows: NormalizedRow[]
  skipped: { line: number; reason: string }[]
  meta: {
    scannedLines: number
    /** true when the statement has a running-balance column (last amount per row) */
    balanceColumn: boolean
    year: number
  }
}

/** A money amount found in a line, with its position and sign markers. */
interface Amount {
  index: number
  end: number
  value: number // always positive magnitude
  explicitNegative: boolean // wrapped in parens, leading '-', or trailing 'DR'
  explicitCredit: boolean // trailing 'CR'
}

// Core money token: digits with optional thousands separators, required cents.
// Requiring the ".dd" is what keeps phone numbers, ZIP codes, and reference
// ids from being misread as amounts.
const MONEY = /\d{1,3}(?:,\d{3})*\.\d{2}(?!\d)/g

/** Section headers that flip the sign of the amounts that follow them. */
const CREDIT_SECTION = /\b(deposits?|credits?|payments? (?:and|&) credits|payments? received|additions?|amounts? received|money in|inflows?)\b/i
const DEBIT_SECTION = /\b(withdrawals?|debits?|purchases?|payments? (?:and|&) other debits|fees?|checks?|card purchases|electronic withdrawals?|money out|outflows?|charges?)\b/i

// When a line carries no explicit sign and no section context, these words in
// the description mark it as money coming in.
const INCOME_HINT = /\b(deposit|payroll|direct dep|salary|refund|reversal|interest paid|rebate|cash ?back|credit memo|reimbursement|dividend|tax ref)\b/i

// A summary/total line even if it happens to start date-like — never a txn.
const TOTAL_LINE = /\b(total|subtotal|beginning balance|ending balance|opening balance|closing balance|balance forward|previous balance|new balance|minimum payment|payment due)\b/i

const MONTH_WORD = /^([A-Za-z]{3,9})\.?$/

function normalizeLines(input: string | string[]): string[] {
  const arr = Array.isArray(input) ? input : input.split(/\r?\n/)
  return arr.map((l) => l.replace(/\u00a0/g, " ").replace(/[ \t]+$/g, '').trimStart())
}

/** Find every money amount in a line together with its sign markers. */
function findAmounts(line: string): Amount[] {
  const out: Amount[] = []
  MONEY.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = MONEY.exec(line))) {
    const start = m.index
    const end = start + m[0].length

    // Look backwards past spaces and a currency symbol for a sign marker.
    let i = start - 1
    while (i >= 0 && line[i] === ' ') i--
    if (i >= 0 && (line[i] === '$' || line[i] === '£' || line[i] === '€')) {
      i--
      while (i >= 0 && line[i] === ' ') i--
    }
    const before = i >= 0 ? line[i] : ''

    // Look forwards past spaces for ')', '-', or CR/DR.
    let j = end
    while (j < line.length && line[j] === ' ') j++
    const after = line.slice(j, j + 2).toUpperCase()
    const closeParen = line[j] === ')'

    out.push({
      index: start,
      end,
      value: Number(m[0].replace(/,/g, '')),
      explicitNegative: before === '-' || before === '(' || closeParen || after === 'DR',
      explicitCredit: after === 'CR',
    })
  }
  return out
}

interface LeadingDate {
  /** ISO-resolvable pieces or a ready ISO string */
  resolve: (year: number, numericFormat: 'MDY' | 'DMY') => string | null
  /** index in the line just past the (possibly doubled) date */
  end: number
  /** raw numeric date string for format inference, or null for named-month/ISO */
  numericRaw: string | null
}

/** Match a date at the very start of a (trimmed) line. */
function matchLeadingDate(line: string): LeadingDate | null {
  // ISO: 2024-03-15
  let m = /^(\d{4})-(\d{2})-(\d{2})\b/.exec(line)
  if (m) {
    const [, y, mo, d] = m.map(Number)
    return { resolve: () => (isValidYmd(y, mo, d) ? toIso(y, mo, d) : null), end: m[0].length, numericRaw: null }
  }

  // Numeric with year: 03/15/2024 or 15.03.2024
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/.exec(line)
  if (m) {
    const raw = m[0]
    const end = withSecondDate(line, m[0].length)
    return {
      numericRaw: raw,
      end,
      resolve: (_y, fmt) => parseDate(raw, fmt),
    }
  }

  // Numeric without year: 03/15 or 03-15  (year filled from statement context)
  m = /^(\d{1,2})[/.-](\d{1,2})\b/.exec(line)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    const raw = m[0]
    const end = withSecondDate(line, m[0].length)
    return {
      numericRaw: raw,
      end,
      resolve: (year, fmt) => {
        const [mo, d] = fmt === 'DMY' ? [b, a] : [a, b]
        return isValidYmd(year, mo, d) ? toIso(year, mo, d) : null
      },
    }
  }

  // Named month first: "Mar 15" / "March 15, 2024"
  m = /^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/.exec(line)
  if (m && MONTH_WORD.test(m[1]) && monthIndexFromName(m[1])) {
    const mo = monthIndexFromName(m[1])!
    const d = Number(m[2])
    const y = m[3] ? Number(m[3]) : null
    return {
      numericRaw: null,
      end: m[0].length,
      resolve: (year) => {
        const yy = y ?? year
        return isValidYmd(yy, mo, d) ? toIso(yy, mo, d) : null
      },
    }
  }

  // Day first: "15 Mar" / "15 March 2024"
  m = /^(\d{1,2})\s+([A-Za-z]{3,9})\.?(?:\s+(\d{4}))?\b/.exec(line)
  if (m && monthIndexFromName(m[2])) {
    const d = Number(m[1])
    const mo = monthIndexFromName(m[2])!
    const y = m[3] ? Number(m[3]) : null
    return {
      numericRaw: null,
      end: m[0].length,
      resolve: (year) => {
        const yy = y ?? year
        return isValidYmd(yy, mo, d) ? toIso(yy, mo, d) : null
      },
    }
  }

  return null
}

/** Statements often print a transaction date and a posting date side by side;
 *  consume a second date token so it doesn't leak into the description. */
function withSecondDate(line: string, end: number): number {
  const rest = line.slice(end)
  const m = /^\s+(\d{1,2})[/.-](\d{1,2})(?:[/.-]\d{2,4})?\b/.exec(rest)
  return m ? end + m[0].length : end
}

/** Best-guess statement year: the most common 4-digit 19xx/20xx in the text. */
function detectYear(lines: string[], fallback: number): number {
  const counts = new Map<number, number>()
  for (const line of lines) {
    const re = /\b(19|20)\d{2}\b/g
    let m: RegExpExecArray | null
    while ((m = re.exec(line))) {
      const y = Number(m[0])
      counts.set(y, (counts.get(y) ?? 0) + 1)
    }
  }
  let best = fallback
  let bestN = 0
  for (const [y, n] of counts) {
    if (n > bestN) {
      bestN = n
      best = y
    }
  }
  return best
}

function cleanDescription(raw: string): string {
  return raw
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—*|:.]+/, '')
    .replace(/[\s\-–—*|:]+$/, '')
    .trim()
}

/**
 * Parse a statement's extracted text into transaction rows.
 *
 * @param input  one string per visual line (or a single newline-joined string)
 * @param opts.now  reference date used only to pick a fallback year for
 *                  year-less dates (keeps tests deterministic)
 */
export function parsePdfStatement(input: string | string[], opts: { now?: Date } = {}): PdfParseResult {
  const now = opts.now ?? new Date()
  const lines = normalizeLines(input)
  const year = detectYear(lines, now.getFullYear())

  // First pass: locate candidate rows, gather numeric date formats, and decide
  // whether there's a running-balance column (most rows carry 2+ amounts).
  interface Candidate {
    lineNo: number
    text: string
    date: LeadingDate
    amounts: Amount[]
  }
  const candidates: Candidate[] = []
  const numericDateRaws: string[] = []
  let multiAmount = 0

  lines.forEach((text, i) => {
    if (!text || TOTAL_LINE.test(text)) return
    const date = matchLeadingDate(text)
    if (!date) return
    const amounts = findAmounts(text)
    if (amounts.length === 0) return
    candidates.push({ lineNo: i + 1, text, date, amounts })
    if (date.numericRaw) numericDateRaws.push(date.numericRaw)
    if (amounts.length >= 2) multiAmount++
  })

  const numericFormat = inferDateFormat(numericDateRaws)
  const fmt: 'MDY' | 'DMY' = numericFormat === 'DMY' ? 'DMY' : 'MDY'
  const balanceColumn = candidates.length > 0 && multiAmount / candidates.length > 0.6

  // Second pass: stream through the document in order so section headers
  // precede the rows they govern, tracking the current section's sign.
  const rows: NormalizedRow[] = []
  const skipped: { line: number; reason: string }[] = []
  let sectionSign: 'credit' | 'debit' | null = null
  const candByLine = new Map(candidates.map((c) => [c.lineNo, c]))

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i]
    if (!text) continue
    const cand = candByLine.get(i + 1)

    if (!cand) {
      // Heading / narrative line — see if it switches the sign context.
      const credit = CREDIT_SECTION.test(text)
      const debit = DEBIT_SECTION.test(text)
      if (credit && !debit) sectionSign = 'credit'
      else if (debit && !credit) sectionSign = 'debit'
      continue
    }

    const iso = cand.date.resolve(year, fmt)
    if (!iso) {
      skipped.push({ line: cand.lineNo, reason: `Unrecognized date in "${truncate(text)}"` })
      continue
    }

    // Choose the transaction amount: with a balance column, the amount is the
    // second-to-last money token (last is the running balance); otherwise the
    // last token, which is the right-aligned amount.
    const amts = cand.amounts
    const chosen = balanceColumn && amts.length >= 2 ? amts[amts.length - 2] : amts[amts.length - 1]

    const description = cleanDescription(text.slice(cand.date.end, chosen.index))
    if (!description) {
      skipped.push({ line: cand.lineNo, reason: 'No description found' })
      continue
    }

    const positive = decideSign(chosen, description, sectionSign)
    rows.push({
      date: iso,
      description,
      amount: Math.round((positive ? chosen.value : -chosen.value) * 100) / 100,
    })
  }

  return { rows, skipped, meta: { scannedLines: lines.length, balanceColumn, year } }
}

/** Returns true when the amount should be treated as money in (positive). */
function decideSign(amount: Amount, description: string, sectionSign: 'credit' | 'debit' | null): boolean {
  if (amount.explicitCredit) return true
  if (amount.explicitNegative) return false
  if (sectionSign === 'credit') return true
  if (sectionSign === 'debit') return false
  if (INCOME_HINT.test(description)) return true
  return false // default: an expense
}

function truncate(s: string): string {
  return s.length > 40 ? `${s.slice(0, 40)}…` : s
}
