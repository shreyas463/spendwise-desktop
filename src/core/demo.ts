import { Transaction, makeId } from './types'
import { currentMonthKey, monthBounds, pad2, shiftMonth, todayIso } from './dates'
import { DEFAULT_RULES } from './categories'
import { categorize, extractMerchant } from './categorize'

/**
 * Deterministic-ish demo dataset: ~6 months of plausible activity so every
 * chart, budget, and chat query has something to show. Amounts are jittered
 * with a seeded PRNG so repeated loads look organic but stable in tests.
 */

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Template {
  description: string
  base: number
  /** expected occurrences per month */
  freq: number
  fixedDay?: number
}

const TEMPLATES: Template[] = [
  { description: 'PAYROLL DIRECT DEPOSIT ACME CORP', base: 3200, freq: 2, fixedDay: 1 },
  { description: 'RENT PAYMENT OAKWOOD APARTMENTS', base: -1650, freq: 1, fixedDay: 2 },
  { description: 'NETFLIX.COM', base: -15.49, freq: 1, fixedDay: 6 },
  { description: 'SPOTIFY USA', base: -10.99, freq: 1, fixedDay: 9 },
  { description: 'COMCAST XFINITY INTERNET', base: -79.99, freq: 1, fixedDay: 12 },
  { description: 'T-MOBILE PHONE BILL', base: -65, freq: 1, fixedDay: 15 },
  { description: 'PG&E ELECTRIC UTILITY', base: -110, freq: 1, fixedDay: 18 },
  { description: 'GEICO INSURANCE PREMIUM', base: -128, freq: 1, fixedDay: 20 },
  { description: '24 HOUR FITNESS GYM', base: -49.99, freq: 1, fixedDay: 3 },
  { description: 'WHOLE FOODS MARKET #10245', base: -87, freq: 4 },
  { description: 'TRADER JOE\'S #552', base: -54, freq: 3 },
  { description: 'SAFEWAY STORE 1732', base: -63, freq: 2 },
  { description: 'STARBUCKS STORE #8841', base: -6.75, freq: 8 },
  { description: 'SQ *BLUE BOTTLE COFFEE', base: -5.5, freq: 4 },
  { description: 'CHIPOTLE ONLINE', base: -14.5, freq: 3 },
  { description: 'DOORDASH*THAI PALACE', base: -32, freq: 3 },
  { description: 'TST* THE RUSTIC TABLE', base: -68, freq: 2 },
  { description: 'UBER TRIP HELP.UBER.COM', base: -18, freq: 4 },
  { description: 'SHELL OIL 5744221', base: -52, freq: 2 },
  { description: 'BART CLIPPER RELOAD', base: -25, freq: 2 },
  { description: 'AMAZON.COM*MK12P3', base: -42, freq: 4 },
  { description: 'TARGET 00028839', base: -58, freq: 2 },
  { description: 'CVS/PHARMACY #9871', base: -23, freq: 2 },
  { description: 'AMC THEATRES ONLINE', base: -34, freq: 1 },
  { description: 'STEAMGAMES.COM', base: -20, freq: 1 },
  { description: 'VENMO PAYMENT', base: -45, freq: 2 },
  { description: 'ATM WITHDRAWAL CHASE BANK', base: -100, freq: 1 },
]

const ONE_OFFS: Template[] = [
  { description: 'UNITED AIRLINES TICKET 0162384', base: -389, freq: 0 },
  { description: 'AIRBNB HMQZW9 PAYMENT', base: -412, freq: 0 },
  { description: 'BEST BUY #1170', base: -246, freq: 0 },
  { description: 'IKEA EAST PALO ALTO', base: -178, freq: 0 },
  { description: 'DELTA DENTAL CLAIM', base: -95, freq: 0 },
  { description: 'TAX REFUND US TREASURY', base: 840, freq: 0 },
  { description: 'COURSERA.ORG SUBSCRIPTION', base: -59, freq: 0 },
  { description: 'MARRIOTT HOTEL SF', base: -289, freq: 0 },
]

export function generateDemoData(now = new Date(), months = 6): Transaction[] {
  const rand = mulberry32(42)
  const out: Transaction[] = []
  const today = todayIso(now)
  const thisMonth = currentMonthKey(now)

  const push = (dateIso: string, description: string, amount: number) => {
    if (dateIso > today) return
    const merchant = extractMerchant(description)
    out.push({
      id: makeId(),
      date: dateIso,
      description,
      merchant,
      amount: Math.round(amount * 100) / 100,
      categoryId: categorize(description, merchant, DEFAULT_RULES),
      account: 'Demo Checking',
      source: 'demo',
    })
  }

  for (let i = months - 1; i >= 0; i--) {
    const key = shiftMonth(thisMonth, -i)
    const { end } = monthBounds(key)
    const daysInMonth = Number(end.slice(8, 10))

    for (const t of TEMPLATES) {
      const times = t.freq <= 1 ? t.freq : Math.max(1, Math.round(t.freq * (0.7 + rand() * 0.6)))
      for (let k = 0; k < times; k++) {
        const day =
          t.fixedDay !== undefined
            ? Math.min(t.fixedDay + (t.freq === 2 ? k * 14 : 0), daysInMonth)
            : 1 + Math.floor(rand() * daysInMonth)
        const jitter = t.fixedDay !== undefined ? 1 : 0.75 + rand() * 0.5
        push(`${key}-${pad2(day)}`, t.description, t.base * jitter)
      }
    }
    // Sprinkle 1–2 one-off purchases per month
    const extras = 1 + Math.floor(rand() * 2)
    for (let k = 0; k < extras; k++) {
      const t = ONE_OFFS[Math.floor(rand() * ONE_OFFS.length)]
      push(`${key}-${pad2(1 + Math.floor(rand() * daysInMonth))}`, t.description, t.base * (0.9 + rand() * 0.2))
    }
  }

  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}
