import { describe, expect, it } from 'vitest'
import { answerQuery, resolveTimeframe } from '../src/core/query'
import { DEFAULT_CATEGORIES } from '../src/core/categories'
import { Transaction } from '../src/core/types'

// Fixed "now" so tests are stable: April 15, 2024
const NOW = new Date(2024, 3, 15)

const tx = (date: string, amount: number, categoryId: string, merchant: string): Transaction => ({
  id: `${date}-${amount}-${merchant}`,
  date,
  description: merchant.toUpperCase(),
  merchant,
  amount,
  categoryId,
  source: 'manual',
})

const ctx = {
  transactions: [
    tx('2024-04-02', -120, 'groceries', 'Safeway'),
    tx('2024-04-05', -45, 'dining', 'Starbucks'),
    tx('2024-03-03', -200, 'groceries', 'Whole Foods'),
    tx('2024-03-10', -80, 'dining', 'Chipotle'),
    tx('2024-03-15', 3000, 'income', 'Acme Corp'),
    tx('2024-03-28', -600, 'travel', 'United Airlines'),
  ],
  categories: DEFAULT_CATEGORIES,
  budgets: [{ categoryId: 'groceries', monthlyLimit: 100 }],
  currency: 'USD',
  now: NOW,
}

describe('resolveTimeframe', () => {
  it('resolves relative months', () => {
    expect(resolveTimeframe('spend this month', NOW).range).toEqual({ start: '2024-04-01', end: '2024-04-30' })
    expect(resolveTimeframe('spend last month', NOW).range).toEqual({ start: '2024-03-01', end: '2024-03-31' })
  })

  it('resolves years and named months', () => {
    expect(resolveTimeframe('spend this year', NOW).range).toEqual({ start: '2024-01-01', end: '2024-12-31' })
    expect(resolveTimeframe('in march', NOW).range).toEqual({ start: '2024-03-01', end: '2024-03-31' })
    // A month that hasn't happened yet this year refers to last year
    expect(resolveTimeframe('in december', NOW).range.start).toBe('2023-12-01')
    expect(resolveTimeframe('in june 2023', NOW).range).toEqual({ start: '2023-06-01', end: '2023-06-30' })
  })

  it('resolves "last N months" and defaults to all time', () => {
    expect(resolveTimeframe('last 3 months', NOW).range).toEqual({ start: '2024-02-01', end: '2024-04-30' })
    expect(resolveTimeframe('spending', NOW).range).toEqual({})
  })
})

describe('answerQuery', () => {
  it('answers total spend with timeframe', () => {
    const a = answerQuery('How much did I spend this month?', ctx)
    expect(a.text).toContain('$165.00')
  })

  it('answers category-specific spend', () => {
    const a = answerQuery('What did I spend on groceries last month?', ctx)
    expect(a.text).toContain('$200.00')
    expect(a.text).toContain('Groceries')
  })

  it('answers merchant-specific spend', () => {
    const a = answerQuery('How much at starbucks this month?', ctx)
    expect(a.text).toContain('$45.00')
    expect(a.text).toContain('Starbucks')
  })

  it('answers top merchants with a table', () => {
    const a = answerQuery('top merchants this year', ctx)
    expect(a.table).toBeDefined()
    expect(a.table!.rows[0][0]).toBe('United Airlines')
  })

  it('answers biggest expense', () => {
    const a = answerQuery('what was my biggest expense in march?', ctx)
    expect(a.text).toContain('United Airlines')
    expect(a.text).toContain('$600.00')
  })

  it('answers income', () => {
    const a = answerQuery('how much income did I get last month?', ctx)
    expect(a.text).toContain('$3,000.00')
  })

  it('compares categories', () => {
    const a = answerQuery('compare groceries vs dining this year', ctx)
    expect(a.text).toContain('$320.00') // groceries total
    expect(a.text).toContain('$125.00') // dining total
  })

  it('reports budget status', () => {
    const a = answerQuery('how are my budgets doing?', ctx)
    expect(a.text).toMatch(/over budget/i)
    expect(a.table!.rows[0][0]).toBe('Groceries')
  })

  it('handles empty data and help', () => {
    const empty = answerQuery('how much did I spend?', { ...ctx, transactions: [] })
    expect(empty.text).toMatch(/don't have any transactions/i)
    expect(answerQuery('help', ctx).text).toMatch(/for example/i)
  })

  it('falls back gracefully on nonsense', () => {
    const a = answerQuery('purple monkey dishwasher', ctx)
    expect(a.text).toMatch(/didn't quite get that/i)
  })
})
