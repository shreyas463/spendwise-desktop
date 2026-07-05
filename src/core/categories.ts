import { Category, Rule } from './types'

/**
 * Built-in categories and keyword rules. Users can add their own rules on
 * top; user rules always take precedence (see categorize.ts).
 */

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Groceries', color: '#22c55e', kind: 'expense' },
  { id: 'dining', name: 'Dining & Coffee', color: '#f97316', kind: 'expense' },
  { id: 'transport', name: 'Transportation', color: '#06b6d4', kind: 'expense' },
  { id: 'shopping', name: 'Shopping', color: '#8b5cf6', kind: 'expense' },
  { id: 'entertainment', name: 'Entertainment', color: '#ec4899', kind: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', color: '#eab308', kind: 'expense' },
  { id: 'housing', name: 'Housing & Rent', color: '#f43f5e', kind: 'expense' },
  { id: 'health', name: 'Health & Fitness', color: '#14b8a6', kind: 'expense' },
  { id: 'travel', name: 'Travel', color: '#3b82f6', kind: 'expense' },
  { id: 'education', name: 'Education', color: '#a3e635', kind: 'expense' },
  { id: 'fees', name: 'Fees & Charges', color: '#94a3b8', kind: 'expense' },
  { id: 'income', name: 'Income', color: '#10b981', kind: 'income' },
  { id: 'transfer', name: 'Transfers', color: '#64748b', kind: 'transfer' },
  { id: 'other', name: 'Other', color: '#9ca3af', kind: 'expense' },
]

export const UNCATEGORIZED_ID = 'other'

const BUILTIN: [string, string][] = [
  // Groceries
  ['whole foods', 'groceries'], ['trader joe', 'groceries'], ['safeway', 'groceries'],
  ['kroger', 'groceries'], ['costco', 'groceries'], ['aldi', 'groceries'],
  ['grocery', 'groceries'], ['supermarket', 'groceries'], ['wegmans', 'groceries'],
  ['h-e-b', 'groceries'], ['publix', 'groceries'], ['sprouts', 'groceries'],
  ['instacart', 'groceries'],
  // Dining & coffee
  ['starbucks', 'dining'], ['mcdonald', 'dining'], ['chipotle', 'dining'],
  ['doordash', 'dining'], ['grubhub', 'dining'], ['uber eats', 'dining'],
  ['ubereats', 'dining'], ['restaurant', 'dining'], ['pizza', 'dining'],
  ['coffee', 'dining'], ['cafe', 'dining'], ['taco', 'dining'], ['sushi', 'dining'],
  ['burger', 'dining'], ['dunkin', 'dining'], ['subway', 'dining'], ['wendy', 'dining'],
  ['chick-fil-a', 'dining'], ['panera', 'dining'], ['bakery', 'dining'], ['deli ', 'dining'],
  // Transportation
  ['uber', 'transport'], ['lyft', 'transport'], ['shell', 'transport'],
  ['chevron', 'transport'], ['exxon', 'transport'], ['gas station', 'transport'],
  ['fuel', 'transport'], ['parking', 'transport'], ['metro', 'transport'],
  ['transit', 'transport'], ['toll', 'transport'], ['bart', 'transport'],
  ['mta ', 'transport'], ['amtrak', 'transport'],
  // Shopping
  ['amazon', 'shopping'], ['amzn', 'shopping'], ['target', 'shopping'],
  ['walmart', 'shopping'], ['best buy', 'shopping'], ['ikea', 'shopping'],
  ['ebay', 'shopping'], ['etsy', 'shopping'], ['nike', 'shopping'],
  ['home depot', 'shopping'], ['lowe\'s', 'shopping'], ['apple store', 'shopping'],
  ['nordstrom', 'shopping'], ['macy', 'shopping'], ['zara', 'shopping'],
  // Entertainment
  ['netflix', 'entertainment'], ['spotify', 'entertainment'], ['hulu', 'entertainment'],
  ['disney', 'entertainment'], ['cinema', 'entertainment'], ['theatre', 'entertainment'],
  ['theater', 'entertainment'], ['steam', 'entertainment'], ['playstation', 'entertainment'],
  ['xbox', 'entertainment'], ['hbo', 'entertainment'], ['ticketmaster', 'entertainment'],
  ['concert', 'entertainment'], ['prime video', 'entertainment'], ['youtube', 'entertainment'],
  // Bills & utilities
  ['electric', 'bills'], ['pg&e', 'bills'], ['water bill', 'bills'],
  ['internet', 'bills'], ['comcast', 'bills'], ['xfinity', 'bills'],
  ['verizon', 'bills'], ['at&t', 'bills'], ['t-mobile', 'bills'],
  ['utility', 'bills'], ['insurance', 'bills'], ['geico', 'bills'],
  ['phone bill', 'bills'],
  // Housing
  ['rent', 'housing'], ['mortgage', 'housing'], ['landlord', 'housing'],
  ['property management', 'housing'], ['hoa ', 'housing'],
  // Health & fitness
  ['pharmacy', 'health'], ['cvs', 'health'], ['walgreens', 'health'],
  ['gym', 'health'], ['fitness', 'health'], ['doctor', 'health'],
  ['dental', 'health'], ['medical', 'health'], ['clinic', 'health'],
  ['peloton', 'health'], ['equinox', 'health'],
  // Travel
  ['airline', 'travel'], ['airlines', 'travel'], ['delta air', 'travel'],
  ['united air', 'travel'], ['southwest', 'travel'], ['airbnb', 'travel'],
  ['hotel', 'travel'], ['marriott', 'travel'], ['hilton', 'travel'],
  ['expedia', 'travel'], ['booking.com', 'travel'], ['hertz', 'travel'],
  // Education
  ['tuition', 'education'], ['university', 'education'], ['college', 'education'],
  ['udemy', 'education'], ['coursera', 'education'], ['bookstore', 'education'],
  // Fees
  ['atm fee', 'fees'], ['service fee', 'fees'], ['overdraft', 'fees'],
  ['interest charge', 'fees'], ['late fee', 'fees'], ['annual fee', 'fees'],
  // Income
  ['payroll', 'income'], ['salary', 'income'], ['direct deposit', 'income'],
  ['paycheck', 'income'], ['dividend', 'income'], ['tax refund', 'income'],
  ['interest payment', 'income'], ['reimbursement', 'income'],
  // Transfers
  ['transfer', 'transfer'], ['venmo', 'transfer'], ['zelle', 'transfer'],
  ['paypal', 'transfer'], ['payment thank you', 'transfer'], ['autopay', 'transfer'],
  ['withdrawal atm', 'transfer'], ['atm withdrawal', 'transfer'], ['cash app', 'transfer'],
]

export const DEFAULT_RULES: Rule[] = BUILTIN.map(([match, categoryId], i) => ({
  id: `builtin-${i}`,
  match,
  categoryId,
  origin: 'builtin',
}))
