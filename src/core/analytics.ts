import { Budget, Category, Transaction } from './types'
import { currentMonthKey, monthBounds, monthKey, monthLabel, monthRange, shiftMonth } from './dates'

/**
 * All analytics aggregations. Pure functions over the transaction list.
 *
 * Conventions:
 *  - "Spending" = negative amounts whose category is not a transfer.
 *  - "Income"   = positive amounts whose category is not a transfer.
 *  - Transfers (credit-card payments, Venmo, ATM moves) are excluded from
 *    both so paying a card bill never double-counts as spending.
 */

export interface DateRange {
  start?: string // inclusive ISO date
  end?: string // inclusive ISO date
}

const round2 = (n: number) => Math.round(n * 100) / 100

function categoryMap(categories: Category[]): Map<string, Category> {
  return new Map(categories.map((c) => [c.id, c]))
}

export function inRange(t: Transaction, range: DateRange): boolean {
  if (range.start && t.date < range.start) return false
  if (range.end && t.date > range.end) return false
  return true
}

function isTransfer(t: Transaction, cats: Map<string, Category>): boolean {
  return cats.get(t.categoryId)?.kind === 'transfer'
}

export function isSpending(t: Transaction, categories: Category[]): boolean {
  return t.amount < 0 && !isTransfer(t, categoryMap(categories))
}

export interface Summary {
  spent: number
  income: number
  net: number
  count: number
}

export function summarize(txs: Transaction[], categories: Category[], range: DateRange = {}): Summary {
  const cats = categoryMap(categories)
  let spent = 0
  let income = 0
  let count = 0
  for (const t of txs) {
    if (!inRange(t, range)) continue
    count++
    if (isTransfer(t, cats)) continue
    if (t.amount < 0) spent += -t.amount
    else income += t.amount
  }
  return { spent: round2(spent), income: round2(income), net: round2(income - spent), count }
}

export interface CategorySlice {
  categoryId: string
  name: string
  color: string
  amount: number
  count: number
  percentage: number
}

/** Spending grouped by category, largest first. */
export function categoryBreakdown(txs: Transaction[], categories: Category[], range: DateRange = {}): CategorySlice[] {
  const cats = categoryMap(categories)
  const acc = new Map<string, { amount: number; count: number }>()
  let total = 0
  for (const t of txs) {
    if (!inRange(t, range) || t.amount >= 0 || isTransfer(t, cats)) continue
    const cur = acc.get(t.categoryId) ?? { amount: 0, count: 0 }
    cur.amount += -t.amount
    cur.count++
    acc.set(t.categoryId, cur)
    total += -t.amount
  }
  return [...acc.entries()]
    .map(([categoryId, { amount, count }]) => {
      const cat = cats.get(categoryId)
      return {
        categoryId,
        name: cat?.name ?? categoryId,
        color: cat?.color ?? '#9ca3af',
        amount: round2(amount),
        count,
        percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

export interface MonthPoint {
  month: string // "2024-03"
  label: string // "Mar 2024"
  spent: number
  income: number
  count: number
}

/** Spending/income per month for the last `months` months ending at `endMonth`. */
export function monthlyTrend(
  txs: Transaction[],
  categories: Category[],
  months: number,
  endMonth: string = currentMonthKey(),
): MonthPoint[] {
  const cats = categoryMap(categories)
  const startMonth = shiftMonth(endMonth, -(months - 1))
  const keys = monthRange(startMonth, endMonth)
  const acc = new Map<string, MonthPoint>(
    keys.map((k) => [k, { month: k, label: monthLabel(k), spent: 0, income: 0, count: 0 }]),
  )
  for (const t of txs) {
    const p = acc.get(monthKey(t.date))
    if (!p) continue
    p.count++
    if (isTransfer(t, cats)) continue
    if (t.amount < 0) p.spent = round2(p.spent + -t.amount)
    else p.income = round2(p.income + t.amount)
  }
  return keys.map((k) => acc.get(k)!)
}

export interface MerchantStat {
  merchant: string
  amount: number
  count: number
}

/** Merchants ranked by total spend within a range. */
export function topMerchants(txs: Transaction[], categories: Category[], range: DateRange = {}, limit = 10): MerchantStat[] {
  const cats = categoryMap(categories)
  const acc = new Map<string, MerchantStat>()
  for (const t of txs) {
    if (!inRange(t, range) || t.amount >= 0 || isTransfer(t, cats)) continue
    const key = t.merchant || t.description
    const cur = acc.get(key) ?? { merchant: key, amount: 0, count: 0 }
    cur.amount = round2(cur.amount + -t.amount)
    cur.count++
    acc.set(key, cur)
  }
  return [...acc.values()].sort((a, b) => b.amount - a.amount).slice(0, limit)
}

export type StackedMonth = { month: string; label: string } & Record<string, string | number>

/**
 * Per-month spending broken down by category — feeds the stacked bar chart.
 * Only the top `maxCategories` categories get their own series; the rest are
 * folded into "Other" to keep the chart legible.
 */
export function stackedByCategory(
  txs: Transaction[],
  categories: Category[],
  months: number,
  endMonth: string = currentMonthKey(),
  maxCategories = 6,
): { data: StackedMonth[]; series: { key: string; color: string }[] } {
  const startMonth = shiftMonth(endMonth, -(months - 1))
  const { start } = monthBounds(startMonth)
  const { end } = monthBounds(endMonth)
  const top = categoryBreakdown(txs, categories, { start, end })
  const main = top.slice(0, maxCategories)
  const mainIds = new Set(main.map((c) => c.categoryId))
  const hasOther = top.length > main.length

  const cats = categoryMap(categories)
  const keys = monthRange(startMonth, endMonth)
  const rows = new Map<string, StackedMonth>(keys.map((k) => [k, { month: k, label: monthLabel(k) }]))
  for (const t of txs) {
    if (t.amount >= 0 || isTransfer(t, cats)) continue
    const row = rows.get(monthKey(t.date))
    if (!row) continue
    const name = mainIds.has(t.categoryId) ? cats.get(t.categoryId)?.name ?? t.categoryId : 'Other'
    row[name] = round2(((row[name] as number) ?? 0) + -t.amount)
  }

  const series = main.map((c) => ({ key: c.name, color: c.color }))
  if (hasOther) series.push({ key: 'Other', color: '#9ca3af' })
  return { data: keys.map((k) => rows.get(k)!), series }
}

export interface BudgetStatus {
  categoryId: string
  name: string
  color: string
  limit: number
  spent: number
  /** 0..∞, 1 = exactly at limit */
  ratio: number
  state: 'ok' | 'warning' | 'over'
}

/** Spending vs budget for one month. `warning` starts at 80% of the limit. */
export function budgetStatus(
  txs: Transaction[],
  categories: Category[],
  budgets: Budget[],
  month: string = currentMonthKey(),
): BudgetStatus[] {
  const { start, end } = monthBounds(month)
  const spentByCat = new Map(categoryBreakdown(txs, categories, { start, end }).map((c) => [c.categoryId, c.amount]))
  const cats = categoryMap(categories)
  return budgets
    .filter((b) => b.monthlyLimit > 0)
    .map((b) => {
      const spent = spentByCat.get(b.categoryId) ?? 0
      const ratio = spent / b.monthlyLimit
      const cat = cats.get(b.categoryId)
      return {
        categoryId: b.categoryId,
        name: cat?.name ?? b.categoryId,
        color: cat?.color ?? '#9ca3af',
        limit: b.monthlyLimit,
        spent,
        ratio,
        state: ratio > 1 ? 'over' : ratio >= 0.8 ? 'warning' : 'ok',
      } as BudgetStatus
    })
    .sort((a, b) => b.ratio - a.ratio)
}

/** Largest expenses in a range, biggest first. */
export function largestExpenses(txs: Transaction[], categories: Category[], range: DateRange = {}, limit = 5): Transaction[] {
  const cats = categoryMap(categories)
  return txs
    .filter((t) => inRange(t, range) && t.amount < 0 && !isTransfer(t, cats))
    .sort((a, b) => a.amount - b.amount)
    .slice(0, limit)
}
