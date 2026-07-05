import { describe, expect, it } from 'vitest'
import { applyRules, buildImport, createDefaultStore, migrateStore } from '../src/core/store'
import { generateDemoData } from '../src/core/demo'
import { Rule } from '../src/core/types'

describe('migrateStore', () => {
  it('returns defaults for null/garbage input', () => {
    expect(migrateStore(null).categories.length).toBeGreaterThan(0)
    expect(migrateStore('junk').version).toBe(1)
    expect(migrateStore({ transactions: 'not-an-array' }).transactions).toEqual([])
  })

  it('preserves valid data and drops corrupt transactions', () => {
    const good = {
      id: 'a',
      date: '2024-01-01',
      description: 'x',
      merchant: 'x',
      amount: -1,
      categoryId: 'other',
      source: 'csv',
    }
    const bad = { id: 'b', date: 'garbage', amount: 'NaN' }
    const store = migrateStore({ transactions: [good, bad], settings: { currency: 'EUR' } })
    expect(store.transactions).toHaveLength(1)
    expect(store.settings.currency).toBe('EUR')
    expect(store.settings.theme).toBe('system') // filled from defaults
  })

  it('merges new built-in rules without clobbering user rules', () => {
    const userRule: Rule = { id: 'u1', match: 'my cafe', categoryId: 'dining', origin: 'user' }
    const store = migrateStore({ rules: [userRule] })
    expect(store.rules.some((r) => r.id === 'u1')).toBe(true)
    expect(store.rules.some((r) => r.origin === 'builtin')).toBe(true)
  })
})

describe('buildImport', () => {
  const rows = [
    { date: '2024-01-01', description: 'STARBUCKS #1', amount: -5 },
    { date: '2024-01-02', description: 'WHOLE FOODS', amount: -50 },
  ]

  it('categorizes and imports fresh rows', () => {
    const result = buildImport(rows, [], createDefaultStore().rules)
    expect(result.imported).toBe(2)
    expect(result.transactions[0].categoryId).toBe('dining')
    expect(result.transactions[1].categoryId).toBe('groceries')
    expect(result.transactions[0].merchant).toBe('Starbucks')
  })

  it('skips duplicates already in the store and within the same file', () => {
    const first = buildImport(rows, [], createDefaultStore().rules)
    const again = buildImport([...rows, rows[0]], first.transactions, createDefaultStore().rules)
    expect(again.imported).toBe(0)
    expect(again.duplicates).toBe(3)
  })
})

describe('applyRules', () => {
  it('recategorizes existing transactions', () => {
    const store = createDefaultStore()
    const [t] = buildImport([{ date: '2024-01-01', description: 'ZZGROBBLE CAFE 99', amount: -9 }], [], store.rules)
      .transactions
    expect(t.categoryId).toBe('dining') // "cafe" builtin
    const rules: Rule[] = [{ id: 'u1', match: 'zzgrobble', categoryId: 'entertainment', origin: 'user' }, ...store.rules]
    expect(applyRules([t], rules)[0].categoryId).toBe('entertainment')
  })
})

describe('generateDemoData', () => {
  it('produces months of varied, categorized, non-future transactions', () => {
    const now = new Date(2024, 3, 15)
    const txs = generateDemoData(now)
    expect(txs.length).toBeGreaterThan(100)
    expect(txs.every((t) => t.date <= '2024-04-15')).toBe(true)
    expect(txs.some((t) => t.amount > 0)).toBe(true) // income present
    const categories = new Set(txs.map((t) => t.categoryId))
    expect(categories.size).toBeGreaterThan(6)
    expect(txs.every((t) => t.source === 'demo')).toBe(true)
    // sorted newest first
    const sorted = [...txs].sort((a, b) => (a.date < b.date ? 1 : -1))
    expect(txs.map((t) => t.date)).toEqual(sorted.map((t) => t.date))
  })
})
