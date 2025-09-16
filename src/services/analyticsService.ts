import { apiClient } from './api'

export interface MonthlySpending {
  month: string
  amount: number
  count: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  color?: string
}

export interface TopMerchant {
  merchant: string
  amount: number
  count: number
}

export interface CategoryTrend {
  month: string
  categories: Record<string, number>
}

export interface AnalyticsData {
  monthlySpending: MonthlySpending[]
  categoryBreakdown: CategoryBreakdown[]
  topMerchants: TopMerchant[]
  categoryTrends: CategoryTrend[]
}

export const analyticsService = {
  async getAnalytics(period: string = '6months'): Promise<AnalyticsData> {
    return apiClient.get<AnalyticsData>(`/api/analytics?period=${period}`)
  },

  async getMonthlySpending(months: number = 6): Promise<MonthlySpending[]> {
    return apiClient.get<MonthlySpending[]>(`/api/analytics/monthly?months=${months}`)
  },

  async getCategoryBreakdown(month?: string): Promise<CategoryBreakdown[]> {
    const endpoint = month ? `/api/analytics/categories?month=${month}` : '/api/analytics/categories'
    return apiClient.get<CategoryBreakdown[]>(endpoint)
  },

  async getTopMerchants(limit: number = 10): Promise<TopMerchant[]> {
    return apiClient.get<TopMerchant[]>(`/api/analytics/merchants?limit=${limit}`)
  },

  async getCategoryTrends(months: number = 6): Promise<CategoryTrend[]> {
    return apiClient.get<CategoryTrend[]>(`/api/analytics/trends?months=${months}`)
  },

  async exportData(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await fetch(`${apiClient['baseUrl']}/api/analytics/export?format=${format}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.blob()
  },
}
