import { describe, expect, it } from 'vitest'
import { importCsv, inferDateFormat, parseAmount, parseCsv, parseDate, toCsv, txKey } from '../src/core/csv'

describe('parseCsv', () => {
  it('parses simple comma-separated data', () => {
    const { headers, rows } = parseCsv('a,b,c\n1,2,3\n4,5,6')
    expect(headers).toEqual(['a', 'b', 'c'])
    expect(rows).toEqual([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])
  })

  it('handles quoted fields with commas, quotes, and newlines', () => {
    const text = 'date,desc,amount\n2024-01-01,"Coffee, ""large""\nwith milk",-4.50'
    const { rows } = parseCsv(text)
    expect(rows[0][1]).toBe('Coffee, "large"\nwith milk')
  })

  it('detects semicolon and tab delimiters', () => {
    expect(parseCsv('a;b;c\n1;2;3').headers).toEqual(['a', 'b', 'c'])
    expect(parseCsv('a\tb\tc\n1\t2\t3').headers).toEqual(['a', 'b', 'c'])
  })

  it('strips BOM and skips blank lines', () => {
    const { headers, rows } = parseCsv('﻿date,amount\n\n2024-01-01,5\n\n')
    expect(headers).toEqual(['date', 'amount'])
    expect(rows).toHaveLength(1)
  })
})

describe('parseAmount', () => {
  it('parses plain and formatted amounts', () => {
    expect(parseAmount('42')).toBe(42)
    expect(parseAmount('$1,234.56')).toBe(1234.56)
    expect(parseAmount('-45.00')).toBe(-45)
    expect(parseAmount('+10.50')).toBe(10.5)
  })

  it('parses accounting negatives', () => {
    expect(parseAmount('(45.00)')).toBe(-45)
    expect(parseAmount('45.00-')).toBe(-45)
  })

  it('parses European decimal commas', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56)
    expect(parseAmount('12,34')).toBe(12.34)
  })

  it('treats lone comma groups of three as thousands', () => {
    expect(parseAmount('1,234')).toBe(1234)
  })

  it('rejects garbage', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('N/A')).toBeNull()
  })
})

describe('date handling', () => {
  it('infers ISO, MDY and DMY formats', () => {
    expect(inferDateFormat(['2024-01-05'])).toBe('ISO')
    expect(inferDateFormat(['01/05/2024', '12/13/2024'])).toBe('MDY')
    expect(inferDateFormat(['13/01/2024', '05/01/2024'])).toBe('DMY')
    expect(inferDateFormat(['Jan 5, 2024'])).toBe('text')
  })

  it('parses each format to ISO', () => {
    expect(parseDate('2024-03-15', 'ISO')).toBe('2024-03-15')
    expect(parseDate('03/15/2024', 'MDY')).toBe('2024-03-15')
    expect(parseDate('15/03/2024', 'DMY')).toBe('2024-03-15')
    expect(parseDate('Mar 15, 2024', 'text')).toBe('2024-03-15')
    expect(parseDate('15 March 2024', 'text')).toBe('2024-03-15')
    expect(parseDate('3/5/24', 'MDY')).toBe('2024-03-05')
  })

  it('rejects invalid dates', () => {
    expect(parseDate('13/45/2024', 'MDY')).toBeNull()
    expect(parseDate('not a date', 'MDY')).toBeNull()
  })
})

describe('importCsv end-to-end', () => {
  it('imports a typical bank export with a signed amount column', () => {
    const text = [
      'Transaction Date,Description,Amount',
      '01/15/2024,STARBUCKS STORE #123,-5.50',
      '01/16/2024,PAYROLL ACME CORP,2500.00',
    ].join('\n')
    const result = importCsv(text)
    expect(result.rows).toEqual([
      { date: '2024-01-15', description: 'STARBUCKS STORE #123', amount: -5.5, account: undefined },
      { date: '2024-01-16', description: 'PAYROLL ACME CORP', amount: 2500, account: undefined },
    ])
    expect(result.skipped).toHaveLength(0)
  })

  it('imports debit/credit column pairs', () => {
    const text = [
      'Date,Details,Debit,Credit',
      '2024-02-01,GROCERY STORE,54.20,',
      '2024-02-02,REFUND,,12.00',
    ].join('\n')
    const result = importCsv(text)
    expect(result.rows[0].amount).toBe(-54.2)
    expect(result.rows[1].amount).toBe(12)
  })

  it('skips unreadable rows but keeps good ones', () => {
    const text = ['Date,Description,Amount', 'garbage,Coffee,-5', '2024-01-01,Coffee,-5', '2024-01-02,,-5'].join('\n')
    const result = importCsv(text)
    expect(result.rows).toHaveLength(1)
    expect(result.skipped).toHaveLength(2)
  })

  it('throws a helpful error when columns are missing', () => {
    expect(() => importCsv('Foo,Bar\n1,2')).toThrow(/date column/i)
  })

  it('throws on non-CSV content', () => {
    expect(() => importCsv('just some text')).toThrow(/header row/i)
  })
})

describe('txKey / toCsv', () => {
  it('normalizes whitespace and case for dedup', () => {
    expect(txKey('2024-01-01', -5.5, 'Starbucks  Store')).toBe(txKey('2024-01-01', -5.5, 'STARBUCKS STORE'))
  })

  it('escapes CSV output correctly', () => {
    expect(toCsv(['a', 'b'], [['x,y', 'he said "hi"']])).toBe('a,b\n"x,y","he said ""hi"""')
  })
})
