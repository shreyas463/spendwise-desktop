export const APP_CONFIG = {
  name: 'SpendWise Desktop',
  version: '1.0.0',
  description: 'Personal finance management desktop application',
} as const

export const API_ENDPOINTS = {
  transactions: '/api/ingest/transactions',
  categories: '/api/categorizer/categories',
  analytics: '/api/analytics',
  chat: '/api/chat',
  upload: '/api/ingest/upload',
} as const

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#FF6B6B' },
  { name: 'Transportation', color: '#4ECDC4' },
  { name: 'Shopping', color: '#45B7D1' },
  { name: 'Entertainment', color: '#96CEB4' },
  { name: 'Bills & Utilities', color: '#FFEAA7' },
  { name: 'Healthcare', color: '#DDA0DD' },
  { name: 'Education', color: '#98D8C8' },
  { name: 'Travel', color: '#F7DC6F' },
  { name: 'Income', color: '#82E0AA' },
  { name: 'Transfer', color: '#F8C471' },
  { name: 'Other', color: '#BB8FCE' },
] as const

export const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
] as const

export const DATE_FORMATS = {
  short: 'MM/DD/YYYY',
  long: 'MMMM DD, YYYY',
  month: 'MMM YYYY',
} as const

export const CURRENCY_FORMATS = {
  USD: { symbol: '$', code: 'USD' },
  EUR: { symbol: '€', code: 'EUR' },
  GBP: { symbol: '£', code: 'GBP' },
  CAD: { symbol: 'C$', code: 'CAD' },
} as const
