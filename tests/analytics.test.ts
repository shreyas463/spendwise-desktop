import { describe, expect, it } from 'vitest'
import {
  budgetStatus,
  categoryBreakdown,
  largestExpenses,
  monthlyTrend,
  stackedByCategory,
  summarize,
  topMerchants,
} from '../src/core/analytics'
import { DEFAULT_CATEGORIES } from '../src/core/categories'
import { Transaction } from '../src/core/types'

const tx = (date: string, amount: number, categoryId: string, merchant = 'M', description = 'D'): Transaction => ({
  id: `${date}-${amount}-${merchant}`,
  date,
  description,
  merchant,
  amount,
  categoryId,
  source: 'manual',
})

const cats = DEFAULT_CATEGORIES

const sample: Transaction[] = [
  tx('2024-03-01', -100, 'groceries', 'Safeway'),
  tx('2024-03-05', -50, 'dining', 'Starbucks'),
  tx('2024-03-10', -30, 'dining', 'Starbucks'),
  tx('2024-03-15', 2000, 'income', 'Acme Corp'),
  tx('2024-03-20', -500, 'transfer', 'Venmo'), // must be excluded from spending
  tx('2024-02-10', -200, 'groceries', 'Safeway'),
  tx('2024-01-10', -75, 'transport', 'Shell'),
]

describe('summarize', () => {
  it('computes spent, income, and net excluding transfers', () => {
    const s = summarize(sample, cats, { start: '2024-03-01', end: '2024-03-31' })
    expect(s.spent).toBe(180)
    expect(s.income).toBe(2000)
    expect(s.net).toBe(1820)
    expect(s.count).toBe(5) // transfers still count as transactions
  })

  it('applies date ranges inclusively', () => {
    const s = summarize(sample, cats, { start: '2024-02-10', end: '2024-03-01' })
    expect(s.spent).toBe(300)
  })
})

describe('categoryBreakdown', () => {
  it('groups spending by category, sorted by amount, with percentages', () => {
    const slices = categoryBreakdown(sample, cats, { start: '2024-03-01', end: '2024-03-31' })
    expect(slices.map((s) => s.categoryId)).toEqual(['groceries', 'dining'])
    expect(slices[0].amount).toBe(100)
    expect(slices[1].amount).toBe(80)
    expect(slices[0].percentage + slices[1].percentage).toBeCloseTo(100, 0)
  })
})

describe('monthlyTrend', () => {
  it('returns one point per month with zero-filled gaps', () => {
    const trend = monthlyTrend(sample, cats, 4, '2024-04')
    expect(trend.map((p) => p.month)).toEqual(['2024-01', '2024-02', '2024-03', '2024-04'])
    expect(trend[0].spent).toBe(75)
    expect(trend[2].spent).toBe(180)
    expect(trend[2].income).toBe(2000)
    expect(trend[3].spent).toBe(0)
  })
})

describe('topMerchants', () => {
  it('aggregates and ranks merchants', () => {
    const tops = topMerchants(sample, cats, { start: '2024-03-01', end: '2024-03-31' })
    expect(tops[0]).toEqual({ merchant: 'Safeway', amount: 100, count: 1 })
    expect(tops[1]).toEqual({ merchant: 'Starbucks', amount: 80, count: 2 })
  })
})

describe('stackedByCategory', () => {
  it('produces per-month category series', () => {
    const { data, series } = stackedByCategory(sample, cats, 3, '2024-03')
    expect(series.map((s) => s.key)).toContain('Groceries')
    const march = data.find((d) => d.month === '2024-03')!
    expect(march['Groceries']).toBe(100)
    expect(march['Dining & Coffee']).toBe(80)
  })
})

describe('budgetStatus', () => {
  it('reports ok/warning/over states', () => {
    const budgets = [
      { categoryId: 'groceries', monthlyLimit: 90 }, // over (100)
      { categoryId: 'dining', monthlyLimit: 100 }, // warning (80)
      { categoryId: 'transport', monthlyLimit: 100 }, // ok (0)
    ]
    const statuses = budgetStatus(sample, cats, budgets, '2024-03')
    expect(statuses.find((s) => s.categoryId === 'groceries')?.state).toBe('over')
    expect(statuses.find((s) => s.categoryId === 'dining')?.state).toBe('warning')
    expect(statuses.find((s) => s.categoryId === 'transport')?.state).toBe('ok')
    // sorted by ratio, worst first
    expect(statuses[0].categoryId).toBe('groceries')
  })
})

describe('largestExpenses', () => {
  it('excludes transfers and sorts by magnitude', () => {
    const big = largestExpenses(sample, cats, {}, 2)
    expect(big[0].categoryId).toBe('groceries')
    expect(big[0].amount).toBe(-200)
    expect(big.every((t) => t.categoryId !== 'transfer')).toBe(true)
  })
})
