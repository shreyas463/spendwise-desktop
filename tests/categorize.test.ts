import { describe, expect, it } from 'vitest'
import { categorize, extractMerchant } from '../src/core/categorize'
import { DEFAULT_RULES } from '../src/core/categories'
import { Rule } from '../src/core/types'

describe('extractMerchant', () => {
  it('strips processor prefixes and store numbers', () => {
    expect(extractMerchant('SQ *BLUE BOTTLE COFFEE #442')).toBe('Blue Bottle Coffee')
    expect(extractMerchant('TST* THE RUSTIC TABLE')).toBe('The Rustic Table')
    expect(extractMerchant('STARBUCKS STORE #8841')).toBe('Starbucks Store')
  })

  it('title-cases all-caps descriptions but keeps mixed case', () => {
    expect(extractMerchant('WHOLE FOODS MARKET')).toBe('Whole Foods Market')
    expect(extractMerchant('Netflix.com')).toBe('Netflix.com')
    expect(extractMerchant("TRADER JOE'S #552")).toBe("Trader Joe's")
  })

  it('never returns an empty string', () => {
    expect(extractMerchant('###')).not.toBe('')
  })
})

describe('categorize', () => {
  const cat = (desc: string) => categorize(desc, extractMerchant(desc), DEFAULT_RULES)

  it('matches built-in merchant rules', () => {
    expect(cat('STARBUCKS STORE #123')).toBe('dining')
    expect(cat('WHOLE FOODS MARKET')).toBe('groceries')
    expect(cat('SHELL OIL 57442')).toBe('transport')
    expect(cat('NETFLIX.COM')).toBe('entertainment')
    expect(cat('PAYROLL DIRECT DEPOSIT')).toBe('income')
    expect(cat('VENMO PAYMENT')).toBe('transfer')
  })

  it('falls back to "other" when nothing matches', () => {
    expect(cat('ZZGROBBLE WIDGETS')).toBe('other')
  })

  it('prefers user rules over built-ins regardless of specificity', () => {
    const userRule: Rule = { id: 'u1', match: 'starbucks', categoryId: 'entertainment', origin: 'user' }
    expect(categorize('STARBUCKS STORE', 'Starbucks Store', [...DEFAULT_RULES, userRule])).toBe('entertainment')
  })

  it('prefers longer matches within the same origin', () => {
    const rules: Rule[] = [
      { id: '1', match: 'uber', categoryId: 'transport', origin: 'builtin' },
      { id: '2', match: 'uber eats', categoryId: 'dining', origin: 'builtin' },
    ]
    expect(categorize('UBER EATS ORDER', 'Uber Eats Order', rules)).toBe('dining')
    expect(categorize('UBER TRIP', 'Uber Trip', rules)).toBe('transport')
  })
})
