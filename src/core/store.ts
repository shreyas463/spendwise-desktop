import { ImportResult, Rule, Store, Transaction, makeId } from './types'
import { DEFAULT_CATEGORIES, DEFAULT_RULES } from './categories'
import { NormalizedRow, txKey } from './csv'
import { categorize, extractMerchant } from './categorize'

/** Fresh store for first launch. */
export function createDefaultStore(): Store {
  return {
    version: 1,
    transactions: [],
    categories: DEFAULT_CATEGORIES,
    rules: [...DEFAULT_RULES],
    budgets: [],
    settings: { theme: 'system', currency: 'USD' },
    chatHistory: [],
  }
}

/**
 * Validate + upgrade whatever was on disk. Unknown or corrupt data falls back
 * to defaults per-field rather than wiping everything.
 */
export function migrateStore(raw: unknown): Store {
  const def = createDefaultStore()
  if (!raw || typeof raw !== 'object') return def
  const r = raw as Partial<Store>
  const store: Store = {
    version: 1,
    transactions: Array.isArray(r.transactions) ? r.transactions.filter(isValidTransaction) : def.transactions,
    categories: Array.isArray(r.categories) && r.categories.length > 0 ? r.categories : def.categories,
    rules: Array.isArray(r.rules) ? r.rules : def.rules,
    budgets: Array.isArray(r.budgets) ? r.budgets : def.budgets,
    settings: { ...def.settings, ...(typeof r.settings === 'object' ? r.settings : {}) },
    chatHistory: Array.isArray(r.chatHistory) ? r.chatHistory : def.chatHistory,
  }
  // Built-in rules can gain entries between versions; merge them in without
  // clobbering user rules.
  const have = new Set(store.rules.map((rule) => rule.id))
  for (const rule of DEFAULT_RULES) {
    if (!have.has(rule.id)) store.rules.push(rule)
  }
  return store
}

function isValidTransaction(t: unknown): t is Transaction {
  if (!t || typeof t !== 'object') return false
  const x = t as Transaction
  return (
    typeof x.id === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(x.date ?? '') &&
    typeof x.description === 'string' &&
    typeof x.amount === 'number' &&
    Number.isFinite(x.amount)
  )
}

/**
 * Turn normalized CSV rows into categorized transactions, skipping any that
 * already exist (same date + amount + description).
 */
export function buildImport(rows: NormalizedRow[], existing: Transaction[], rules: Rule[]): ImportResult {
  const seen = new Set(existing.map((t) => txKey(t.date, t.amount, t.description)))
  const out: Transaction[] = []
  let duplicates = 0
  for (const row of rows) {
    const key = txKey(row.date, row.amount, row.description)
    if (seen.has(key)) {
      duplicates++
      continue
    }
    seen.add(key)
    const merchant = extractMerchant(row.description)
    out.push({
      id: makeId(),
      date: row.date,
      description: row.description,
      merchant,
      amount: row.amount,
      categoryId: categorize(row.description, merchant, rules),
      account: row.account,
      source: 'csv',
    })
  }
  return { imported: out.length, duplicates, failed: 0, transactions: out }
}

/**
 * Re-categorize every transaction with the current rule set. Used after a
 * user adds or removes a rule. Manual category assignments are preserved by
 * callers passing only auto-categorized transactions if desired; here we
 * simply recompute everything the rules can claim.
 */
export function applyRules(transactions: Transaction[], rules: Rule[]): Transaction[] {
  return transactions.map((t) => ({
    ...t,
    categoryId: categorize(t.description, t.merchant, rules),
  }))
}
