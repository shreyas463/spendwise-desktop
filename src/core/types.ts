/**
 * Shared domain types. Everything in src/core is pure TypeScript with no
 * Electron, DOM, or React dependencies so it can run in the main process,
 * the renderer, and unit tests unchanged.
 */

/** Amounts follow bank-statement convention: negative = money out, positive = money in. */
export interface Transaction {
  id: string
  /** ISO date, yyyy-mm-dd */
  date: string
  description: string
  /** Cleaned-up merchant name derived from the description */
  merchant: string
  amount: number
  categoryId: string
  /** Optional account label, e.g. "Chase Checking" */
  account?: string
  source: 'csv' | 'manual' | 'demo'
  notes?: string
}

export interface Category {
  id: string
  name: string
  color: string
  /** Income categories are excluded from spending analytics */
  kind: 'expense' | 'income' | 'transfer'
}

/** A categorization rule: if a transaction's text contains `match`, assign `categoryId`. */
export interface Rule {
  id: string
  /** Case-insensitive substring matched against merchant + description */
  match: string
  categoryId: string
  /** User rules always win over built-in rules */
  origin: 'user' | 'builtin'
}

export interface Budget {
  categoryId: string
  /** Monthly limit in the user's currency, > 0 */
  monthlyLimit: number
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  currency: string // ISO 4217 code, e.g. "USD"
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Optional structured payload rendered as a table under the answer */
  table?: { columns: string[]; rows: (string | number)[][] }
  at: string // ISO timestamp
}

/** The entire persisted application state — one document, atomically written. */
export interface Store {
  version: 1
  transactions: Transaction[]
  categories: Category[]
  rules: Rule[]
  budgets: Budget[]
  settings: Settings
  chatHistory: ChatMessage[]
}

export interface ImportResult {
  imported: number
  duplicates: number
  failed: number
  transactions: Transaction[]
}

let counter = 0
/** Collision-safe id without external deps: time + random + monotonic counter. */
export function makeId(): string {
  counter = (counter + 1) % 36 ** 3
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8) +
    counter.toString(36).padStart(3, '0')
  )
}
