import { describe, expect, it } from 'vitest'
import { parsePdfStatement } from '../src/core/pdf'

const NOW = new Date(2024, 5, 1) // June 2024, used only for fallback year

describe('parsePdfStatement — credit card layout (sections, no balance column)', () => {
  // Amounts are right-aligned single values; sign comes from section headers.
  const lines = [
    'PREMIER CARD                              Account ending 4021',
    'Statement Period 03/01/2024 to 03/31/2024',
    '',
    'Payments and Credits',
    '03/05   AUTOPAY PAYMENT - THANK YOU              1,240.00',
    '03/12   AMAZON.COM REFUND                           25.99',
    '',
    'Purchases and Debits',
    '03/02   STARBUCKS STORE #123                         5.50',
    '03/08   WHOLE FOODS MKT 10245                       84.37',
    '03/15   UBER TRIP HELP.UBER.COM                     18.20',
    '',
    'Total Purchases and Debits                         108.07',
    'Page 1 of 2',
  ]

  const result = parsePdfStatement(lines, { now: NOW })

  it('keeps only the five real transactions (drops headers, totals, footers)', () => {
    expect(result.rows).toHaveLength(5)
  })

  it('signs credits positive and purchases negative from section context', () => {
    const byDesc = Object.fromEntries(result.rows.map((r) => [r.description, r.amount]))
    expect(byDesc['AUTOPAY PAYMENT - THANK YOU']).toBe(1240)
    expect(byDesc['AMAZON.COM REFUND']).toBe(25.99)
    expect(byDesc['STARBUCKS STORE #123']).toBe(-5.5)
    expect(byDesc['WHOLE FOODS MKT 10245']).toBe(-84.37)
    expect(byDesc['UBER TRIP HELP.UBER.COM']).toBe(-18.2)
  })

  it('fills the year from the statement period', () => {
    expect(result.rows.every((r) => r.date.startsWith('2024-03'))).toBe(true)
    expect(result.meta.balanceColumn).toBe(false)
  })
})

describe('parsePdfStatement — checking layout (running balance column)', () => {
  const lines = [
    'EVERYDAY CHECKING',
    'Date        Description                        Amount        Balance',
    '01/03/2024  DIRECT DEPOSIT PAYROLL ACME        2,500.00      5,320.11',
    '01/05/2024  RENT PAYMENT OAKWOOD APTS         -1,650.00      3,670.11',
    '01/09/2024  WHOLE FOODS MARKET                  -84.37       3,585.74',
    '01/22/2024  ATM WITHDRAWAL                     -100.00       3,485.74',
    'Beginning Balance                                            2,820.11',
    'Ending Balance                                               3,485.74',
  ]

  const result = parsePdfStatement(lines, { now: NOW })

  it('detects the balance column and uses the transaction amount, not the balance', () => {
    expect(result.meta.balanceColumn).toBe(true)
    expect(result.rows).toHaveLength(4)
    const amounts = result.rows.map((r) => r.amount)
    expect(amounts).toEqual([2500, -1650, -84.37, -100])
  })

  it('treats an unsigned deposit as income via keyword hint', () => {
    const deposit = result.rows.find((r) => r.description.includes('PAYROLL'))
    expect(deposit?.amount).toBe(2500)
  })

  it('skips beginning/ending balance summary lines', () => {
    expect(result.rows.some((r) => /balance/i.test(r.description))).toBe(false)
  })
})

describe('parsePdfStatement — noise rejection', () => {
  const lines = [
    'BANK OF EXAMPLE',
    '1234 Market Street, San Francisco CA 94103',
    'Customer Service: 1-800-555-0199',
    'Account Number: ****6789',
    'Reference 8837401 posted on system',
    '02/14  NETFLIX.COM 866-579-7172 CA               15.49',
    'Questions? Call 1-800-555-0199 24/7',
  ]

  const result = parsePdfStatement(lines, { now: NOW })

  it('extracts only the transaction and ignores phone numbers, ids, and addresses', () => {
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].amount).toBe(-15.49)
    expect(result.rows[0].description).toContain('NETFLIX.COM')
  })

  it('falls back to the reference-date year when no statement year is present', () => {
    expect(result.rows[0].date).toBe('2024-02-14')
  })
})

describe('parsePdfStatement — sign markers and formats', () => {
  it('reads parentheses and trailing minus/CR/DR markers', () => {
    const lines = [
      '03/01/2024  PURCHASE ONE                (45.00)',
      '03/02/2024  PURCHASE TWO                 45.00-',
      '03/03/2024  CREDIT ADJUSTMENT            45.00 CR',
      '03/04/2024  DEBIT ADJUSTMENT             45.00 DR',
    ]
    const rows = parsePdfStatement(lines, { now: NOW }).rows
    expect(rows.map((r) => r.amount)).toEqual([-45, -45, 45, -45])
  })

  it('parses named-month and day-first dates', () => {
    const lines = ['Mar 5, 2024   COFFEE SHOP        4.25', '6 Apr 2024    BOOK STORE        20.00']
    const rows = parsePdfStatement(lines, { now: NOW }).rows
    expect(rows[0].date).toBe('2024-03-05')
    expect(rows[1].date).toBe('2024-04-06')
  })

  it('handles a transaction date + posting date pair without leaking into description', () => {
    const rows = parsePdfStatement(['03/02  03/04  TARGET STORE 00028      58.13'], { now: NOW }).rows
    expect(rows[0].date).toBe('2024-03-02')
    expect(rows[0].description).toBe('TARGET STORE 00028')
    expect(rows[0].amount).toBe(-58.13)
  })

  it('returns nothing for a document with no transaction rows', () => {
    const rows = parsePdfStatement(['Welcome to your statement', 'Thank you for banking with us'], { now: NOW }).rows
    expect(rows).toHaveLength(0)
  })
})
