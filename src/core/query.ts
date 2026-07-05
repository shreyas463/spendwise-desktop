import { Budget, Category, Transaction } from './types'
import {
  DateRange,
  budgetStatus,
  categoryBreakdown,
  largestExpenses,
  monthlyTrend,
  summarize,
  topMerchants,
} from './analytics'
import { currentMonthKey, monthBounds, monthIndexFromName, monthLabel, pad2, shiftMonth } from './dates'

/**
 * The "chat with your data" engine. Instead of shipping a local LLM, we parse
 * a small, well-defined family of questions deterministically: timeframe +
 * intent + subject. Fast, private, and always factually grounded in the data.
 */

export interface QueryContext {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  currency: string
  now?: Date
}

export interface QueryAnswer {
  text: string
  table?: { columns: string[]; rows: (string | number)[][] }
}

interface Timeframe {
  range: DateRange
  label: string
}

function fmtMoney(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  } catch {
    return `$${n.toFixed(2)}`
  }
}

function monthTimeframe(key: string): Timeframe {
  const { start, end } = monthBounds(key)
  return { range: { start, end }, label: `in ${monthLabel(key)}` }
}

export function resolveTimeframe(q: string, now = new Date()): Timeframe {
  const thisMonth = currentMonthKey(now)
  const year = now.getFullYear()

  if (/\b(this|current)\s+month\b/.test(q)) return monthTimeframe(thisMonth)
  if (/\b(last|previous|past)\s+month\b/.test(q)) return monthTimeframe(shiftMonth(thisMonth, -1))
  if (/\bthis\s+year\b/.test(q)) {
    return { range: { start: `${year}-01-01`, end: `${year}-12-31` }, label: `in ${year}` }
  }
  if (/\blast\s+year\b/.test(q)) {
    return { range: { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` }, label: `in ${year - 1}` }
  }

  const lastN = q.match(/\b(?:last|past)\s+(\d+)\s+months?\b/)
  if (lastN) {
    const n = Math.min(Number(lastN[1]), 120)
    const startKey = shiftMonth(thisMonth, -(n - 1))
    return {
      range: { start: monthBounds(startKey).start, end: monthBounds(thisMonth).end },
      label: `over the last ${n} months`,
    }
  }

  // "in March", "in March 2023", bare month names
  const monthMatch = q.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b\.?\s*(\d{4})?/,
  )
  if (monthMatch) {
    const m = monthIndexFromName(monthMatch[1])
    if (m) {
      let y = monthMatch[2] ? Number(monthMatch[2]) : year
      // A bare month name that hasn't happened yet this year means last year
      if (!monthMatch[2] && `${y}-${pad2(m)}` > thisMonth) y -= 1
      return monthTimeframe(`${y}-${pad2(m)}`)
    }
  }

  const yearMatch = q.match(/\bin\s+(\d{4})\b/)
  if (yearMatch) {
    const y = Number(yearMatch[1])
    return { range: { start: `${y}-01-01`, end: `${y}-12-31` }, label: `in ${y}` }
  }

  return { range: {}, label: 'across all your data' }
}

/** Find a category mentioned in the question, with a few common synonyms. */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  groceries: ['grocery', 'groceries', 'food shopping', 'supermarket'],
  dining: ['dining', 'restaurants', 'restaurant', 'eating out', 'food', 'coffee', 'takeout', 'take-out'],
  transport: ['transport', 'transportation', 'gas', 'fuel', 'commute', 'uber', 'rides'],
  shopping: ['shopping', 'clothes', 'clothing', 'amazon'],
  entertainment: ['entertainment', 'movies', 'streaming', 'subscriptions', 'games'],
  bills: ['bills', 'utilities', 'utility', 'internet', 'phone'],
  housing: ['housing', 'rent', 'mortgage'],
  health: ['health', 'healthcare', 'medical', 'fitness', 'gym', 'pharmacy'],
  travel: ['travel', 'trips', 'flights', 'hotels', 'vacation'],
  education: ['education', 'tuition', 'courses', 'books'],
  fees: ['fees', 'charges', 'bank fees'],
  income: ['income', 'earnings', 'salary'],
}

function findCategory(q: string, categories: Category[]): Category | null {
  for (const c of categories) {
    if (q.includes(c.name.toLowerCase())) return c
  }
  for (const [id, words] of Object.entries(CATEGORY_SYNONYMS)) {
    const cat = categories.find((c) => c.id === id)
    if (!cat) continue
    for (const w of words) {
      if (new RegExp(`\\b${w}\\b`).test(q)) return cat
    }
  }
  return null
}

function findMerchant(q: string, transactions: Transaction[]): string | null {
  const merchants = new Map<string, string>()
  for (const t of transactions) {
    if (t.merchant) merchants.set(t.merchant.toLowerCase(), t.merchant)
  }
  // Longest merchant name first so "amazon prime" beats "amazon"
  const sorted = [...merchants.keys()].sort((a, b) => b.length - a.length)
  for (const m of sorted) {
    if (m.length >= 3 && q.includes(m)) return merchants.get(m)!
  }
  return null
}

const HELP_TEXT = `I can answer questions about your transactions, for example:
• "How much did I spend this month?"
• "What did I spend on groceries last month?"
• "Top merchants this year"
• "What was my biggest expense in March?"
• "Compare dining vs groceries this year"
• "What's my average monthly spending?"
• "How are my budgets doing?"
• "How much income did I get last month?"`

export function answerQuery(question: string, ctx: QueryContext): QueryAnswer {
  const { transactions, categories, budgets, currency } = ctx
  const now = ctx.now ?? new Date()
  const q = question.toLowerCase().replace(/[?!.]+/g, ' ').replace(/\s+/g, ' ').trim()
  const money = (n: number) => fmtMoney(n, currency)

  if (!q || /\b(help|what can you do|examples?)\b/.test(q)) {
    return { text: HELP_TEXT }
  }
  if (transactions.length === 0) {
    return { text: "You don't have any transactions yet. Import a CSV from the Transactions page (or load the demo data in Settings) and ask me again." }
  }

  const tf = resolveTimeframe(q, now)

  // --- Budgets ---
  if (/\bbudgets?\b/.test(q)) {
    const statuses = budgetStatus(transactions, categories, budgets, currentMonthKey(now))
    if (statuses.length === 0) {
      return { text: 'You have no budgets set up yet. You can add monthly category limits on the Budgets page.' }
    }
    const over = statuses.filter((s) => s.state === 'over')
    const summary =
      over.length > 0
        ? `You're over budget in ${over.map((s) => s.name).join(', ')} this month.`
        : 'All budgets are on track this month.'
    return {
      text: summary,
      table: {
        columns: ['Category', 'Spent', 'Limit', 'Used'],
        rows: statuses.map((s) => [s.name, money(s.spent), money(s.limit), `${Math.round(s.ratio * 100)}%`]),
      },
    }
  }

  // --- Compare two categories ---
  const vs = q.match(/compare\s+(.+?)\s+(?:vs\.?|versus|and|to|with)\s+([a-z\s&]+)/)
  if (vs) {
    const a = findCategory(vs[1].trim(), categories)
    const b = findCategory(vs[2].trim(), categories)
    if (a && b) {
      const slices = categoryBreakdown(transactions, categories, tf.range)
      const aAmt = slices.find((s) => s.categoryId === a.id)?.amount ?? 0
      const bAmt = slices.find((s) => s.categoryId === b.id)?.amount ?? 0
      const [hi, hiAmt, loAmt] = aAmt >= bAmt ? ([a, aAmt, bAmt] as const) : ([b, bAmt, aAmt] as const)
      const diff = hiAmt - loAmt
      return {
        text: `${tf.label[0].toUpperCase()}${tf.label.slice(1)}, you spent ${money(aAmt)} on ${a.name} and ${money(bAmt)} on ${b.name} — ${hi.name} is higher by ${money(diff)}${loAmt > 0 ? ` (${(hiAmt / loAmt).toFixed(1)}×)` : ''}.`,
      }
    }
  }

  // --- Top merchants / categories ---
  if (/\b(top|most|biggest|largest)\b.*\b(merchants?|stores?|shops?|places?)\b/.test(q) || /where.*(spend|money)/.test(q)) {
    const tops = topMerchants(transactions, categories, tf.range, 5)
    if (tops.length === 0) return { text: `No spending found ${tf.label}.` }
    return {
      text: `Your top merchants ${tf.label}: ${tops[0].merchant} leads at ${money(tops[0].amount)}.`,
      table: {
        columns: ['Merchant', 'Spent', 'Transactions'],
        rows: tops.map((m) => [m.merchant, money(m.amount), m.count]),
      },
    }
  }
  if (/\b(top|most|biggest|largest)\b.*\bcategor/.test(q) || /\bbreakdown\b/.test(q)) {
    const slices = categoryBreakdown(transactions, categories, tf.range).slice(0, 8)
    if (slices.length === 0) return { text: `No spending found ${tf.label}.` }
    return {
      text: `Your biggest category ${tf.label} is ${slices[0].name} at ${money(slices[0].amount)} (${slices[0].percentage}% of spending).`,
      table: {
        columns: ['Category', 'Spent', 'Share'],
        rows: slices.map((s) => [s.name, money(s.amount), `${s.percentage}%`]),
      },
    }
  }

  // --- Biggest single expense ---
  if (/\b(biggest|largest|most expensive|highest)\b.*\b(expense|transaction|purchase|charge)?\b/.test(q) && /\b(expense|transaction|purchase|charge)\b/.test(q)) {
    const big = largestExpenses(transactions, categories, tf.range, 3)
    if (big.length === 0) return { text: `No expenses found ${tf.label}.` }
    const t = big[0]
    return {
      text: `Your biggest expense ${tf.label} was ${money(-t.amount)} at ${t.merchant} on ${t.date}.`,
      table: {
        columns: ['Date', 'Merchant', 'Amount'],
        rows: big.map((b) => [b.date, b.merchant, money(-b.amount)]),
      },
    }
  }

  // --- Average monthly spending ---
  if (/\baverage\b/.test(q)) {
    const months = 6
    const trend = monthlyTrend(transactions, categories, months, currentMonthKey(now))
    const withData = trend.filter((m) => m.count > 0)
    if (withData.length === 0) return { text: 'Not enough data to compute an average yet.' }
    const avg = withData.reduce((s, m) => s + m.spent, 0) / withData.length
    return {
      text: `Over the last ${withData.length} month${withData.length > 1 ? 's' : ''} with activity, you spent an average of ${money(avg)} per month.`,
      table: {
        columns: ['Month', 'Spent', 'Income'],
        rows: trend.map((m) => [m.label, money(m.spent), money(m.income)]),
      },
    }
  }

  // --- Trend over time ---
  if (/\b(trend|over time|history|monthly)\b/.test(q)) {
    const trend = monthlyTrend(transactions, categories, 6, currentMonthKey(now))
    return {
      text: 'Here is your spending over the last 6 months.',
      table: {
        columns: ['Month', 'Spent', 'Income', 'Net'],
        rows: trend.map((m) => [m.label, money(m.spent), money(m.income), money(m.income - m.spent)]),
      },
    }
  }

  // --- Income ---
  if (/\b(income|earn(ed)?|salary|made|deposits?)\b/.test(q) && !/\bspen[dt]\b/.test(q)) {
    const s = summarize(transactions, categories, tf.range)
    return { text: `You received ${money(s.income)} in income ${tf.label}.` }
  }

  // --- Net / savings ---
  if (/\b(net|save(d)?|savings|left over|cash ?flow)\b/.test(q)) {
    const s = summarize(transactions, categories, tf.range)
    const verb = s.net >= 0 ? 'saved' : 'overspent by'
    return { text: `${tf.label[0].toUpperCase()}${tf.label.slice(1)}, you had ${money(s.income)} in and ${money(s.spent)} out — you ${verb} ${money(Math.abs(s.net))}.` }
  }

  // --- Transaction count ---
  if (/\bhow many\b/.test(q)) {
    const s = summarize(transactions, categories, tf.range)
    return { text: `You have ${s.count} transaction${s.count === 1 ? '' : 's'} ${tf.label}.` }
  }

  // --- Category or merchant specific spend ---
  const cat = findCategory(q, categories)
  if (cat) {
    const slices = categoryBreakdown(transactions, categories, tf.range)
    const slice = slices.find((s) => s.categoryId === cat.id)
    if (cat.kind === 'income') {
      const s = summarize(transactions, categories, tf.range)
      return { text: `You received ${money(s.income)} in income ${tf.label}.` }
    }
    const amount = slice?.amount ?? 0
    const count = slice?.count ?? 0
    return {
      text:
        amount > 0
          ? `You spent ${money(amount)} on ${cat.name} ${tf.label} across ${count} transaction${count === 1 ? '' : 's'}${slice ? ` (${slice.percentage}% of your spending)` : ''}.`
          : `No ${cat.name} spending found ${tf.label}.`,
    }
  }

  const merchant = findMerchant(q, transactions)
  if (merchant) {
    const stats = topMerchants(transactions, categories, tf.range, 1000).find((m) => m.merchant === merchant)
    return {
      text: stats
        ? `You spent ${money(stats.amount)} at ${merchant} ${tf.label} across ${stats.count} visit${stats.count === 1 ? '' : 's'}.`
        : `No spending at ${merchant} found ${tf.label}.`,
    }
  }

  // --- Total spend (generic) ---
  if (/\b(spen[dt]|total|expenses?|cost|much)\b/.test(q)) {
    const s = summarize(transactions, categories, tf.range)
    return { text: `You spent ${money(s.spent)} ${tf.label} across ${s.count} transactions, with ${money(s.income)} coming in.` }
  }

  return { text: `I didn't quite get that.\n\n${HELP_TEXT}` }
}
