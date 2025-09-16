import { apiClient } from './api'
import { Transaction, Category } from '../contexts/DataContext'

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    return apiClient.get<Transaction[]>('/api/ingest/transactions')
  },

  async getTransaction(id: string): Promise<Transaction> {
    return apiClient.get<Transaction>(`/api/ingest/transactions/${id}`)
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    return apiClient.post<Transaction>('/api/ingest/transactions', transaction)
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    return apiClient.put<Transaction>(`/api/ingest/transactions/${id}`, updates)
  },

  async deleteTransaction(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/ingest/transactions/${id}`)
  },

  async uploadCSV(file: File): Promise<{ message: string; count: number }> {
    return apiClient.uploadFile<{ message: string; count: number }>('/api/ingest/upload', file)
  },

  async getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/api/categorizer/categories')
  },

  async categorizeTransaction(transactionId: string): Promise<Transaction> {
    return apiClient.post<Transaction>(`/api/categorizer/categorize/${transactionId}`)
  },
}
