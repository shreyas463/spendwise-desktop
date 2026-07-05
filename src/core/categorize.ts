import { Rule } from './types'
import { UNCATEGORIZED_ID } from './categories'

/**
 * Merchant extraction and rule-based categorization.
 */

const NOISE_PREFIXES = [
  /^pos\s+(debit\s+|purchase\s+)?/i,
  /^(debit|credit)\s+card\s+purchase\s*/i,
  /^(purchase|payment|pmt)\s+/i,
  /^(sq|tst|py|pp|sp)\s*\*\s*/i,
  /^paypal\s*\*\s*/i,
  /^checkcard\s+\d*\s*/i,
  /^(ach|web|tel)\s+(debit|credit)\s*/i,
  /^recurring\s+payment\s*/i,
]

const NOISE_SUFFIXES = [
  /\s+#\d+$/, // "#442" store numbers
  /\s+\d{3,}$/, // bare reference numbers
  /\s+\d{2}\/\d{2}(\/\d{2,4})?$/, // trailing dates
  /\s+(inc|llc|ltd|corp)\.?$/i,
  /\s+[A-Z]{2}$/, // trailing state code
  /\s+x{2,}\d+$/i, // masked card numbers
]

/**
 * Derive a human-friendly merchant name from a raw statement description,
 * e.g. "SQ *BLUE BOTTLE COFFEE #442 OAKLAND CA" → "Blue Bottle Coffee".
 */
export function extractMerchant(description: string): string {
  let s = description.trim()
  for (const re of NOISE_PREFIXES) s = s.replace(re, '')
  // Collapse separators; keep the leading segment which is usually the name
  s = s.split(/\s{3,}|\t/)[0]
  let prev = ''
  while (prev !== s) {
    prev = s
    for (const re of NOISE_SUFFIXES) s = s.replace(re, '')
    s = s.trim()
  }
  s = s.replace(/[*#]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!s) s = description.trim()
  // Title-case ALL-CAPS statements; keep mixed case as-is
  if (s === s.toUpperCase()) {
    s = s
      .toLowerCase()
      .replace(/(^|[\s\-./&])([a-z])/g, (_m, sep, ch) => sep + ch.toUpperCase())
  }
  return s.slice(0, 60)
}

/**
 * Find the category for a transaction. User rules are checked before
 * built-in rules; within each group the longest (most specific) match wins.
 */
export function categorize(description: string, merchant: string, rules: Rule[]): string {
  const hay = `${merchant} ${description}`.toLowerCase()
  let best: Rule | null = null
  let bestScore = -1
  for (const rule of rules) {
    const m = rule.match.toLowerCase().trim()
    if (!m || !hay.includes(m)) continue
    const score = (rule.origin === 'user' ? 1000 : 0) + m.length
    if (score > bestScore) {
      bestScore = score
      best = rule
    }
  }
  return best?.categoryId ?? UNCATEGORIZED_ID
}
