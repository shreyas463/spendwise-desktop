import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  categoryId?: string
  category?: Category
  merchant?: string
  accountType?: string
  accountNumber?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  parentId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AnalyticsData {
  monthlySpending: Array<{ month: string; amount: number; count: number }>
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>
  topMerchants: Array<{ merchant: string; amount: number; count: number }>
  categoryTrends: Array<{ month: string; categories: Record<string, number> }>
}

interface DataContextType {
  transactions: Transaction[]
  categories: Category[]
  analytics: AnalyticsData | null
  loading: boolean
  error: string | null
  
  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  uploadCSV: (file: File) => Promise<void>
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data for development
  useEffect(() => {
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Food & Dining',
        description: 'Restaurants, groceries, and food-related expenses',
        color: '#FF6B6B',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Transportation',
        description: 'Gas, public transport, rideshare',
        color: '#4ECDC4',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Shopping',
        description: 'Clothing, electronics, general merchandise',
        color: '#45B7D1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        date: '2024-01-15',
        description: 'Starbucks Coffee',
        amount: -5.50,
        categoryId: '1',
        category: mockCategories[0],
        merchant: 'Starbucks',
        accountType: 'Credit Card',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        date: '2024-01-14',
        description: 'Shell Gas Station',
        amount: -45.00,
        categoryId: '2',
        category: mockCategories[1],
        merchant: 'Shell',
        accountType: 'Debit Card',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    setCategories(mockCategories)
    setTransactions(mockTransactions)
  }, [])

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    try {
      // TODO: Implement API call
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTransactions(prev => [...prev, newTransaction])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setLoading(true)
    try {
      // TODO: Implement API call
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction')
    } finally {
      setLoading(false)
    }
  }

  const deleteTransaction = async (id: string) => {
    setLoading(true)
    try {
      // TODO: Implement API call
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction')
    } finally {
      setLoading(false)
    }
  }

  const uploadCSV = async (file: File) => {
    setLoading(true)
    try {
      // TODO: Implement CSV upload API call
      console.log('Uploading CSV file:', file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      // TODO: Implement data refresh API calls
      console.log('Refreshing data...')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DataContext.Provider value={{
      transactions,
      categories,
      analytics,
      loading,
      error,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      uploadCSV,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
