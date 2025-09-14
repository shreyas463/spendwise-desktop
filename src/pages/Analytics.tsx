import React from 'react'
import { useData } from '../contexts/DataContext'
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react'

export default function Analytics() {
  const { transactions, categories, loading } = useData()

  // Calculate analytics data
  const categorySpending = categories.map(category => {
    const amount = transactions
      .filter(t => t.categoryId === category.id && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return {
      category: category.name,
      amount,
      color: category.color || '#6B7280'
    }
  }).filter(item => item.amount > 0)

  const totalSpending = categorySpending.reduce((sum, item) => sum + item.amount, 0)

  const monthlyData = [
    { month: 'Jan', amount: 1200, count: 45 },
    { month: 'Feb', amount: 1350, count: 52 },
    { month: 'Mar', amount: 1100, count: 38 },
    { month: 'Apr', amount: 1450, count: 61 },
    { month: 'May', amount: 1300, count: 48 },
    { month: 'Jun', amount: 1600, count: 67 },
  ]

  const topMerchants = [
    { merchant: 'Amazon', amount: 450, count: 12 },
    { merchant: 'Starbucks', amount: 180, count: 24 },
    { merchant: 'Shell', amount: 320, count: 8 },
    { merchant: 'Netflix', amount: 45, count: 3 },
    { merchant: 'Target', amount: 280, count: 6 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <div className="flex items-center space-x-3">
          <select className="input w-40">
            <option>Last 6 months</option>
            <option>Last year</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spending</p>
              <p className="text-2xl font-bold text-danger">${totalSpending.toFixed(2)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-danger" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average per Month</p>
              <p className="text-2xl font-bold text-warning">${(totalSpending / 6).toFixed(2)}</p>
            </div>
            <Calendar className="h-8 w-8 text-warning" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top Category</p>
              <p className="text-2xl font-bold text-primary">
                {categorySpending[0]?.category || 'N/A'}
              </p>
            </div>
            <PieChart className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {categorySpending.map((item, index) => {
              const percentage = (item.amount / totalSpending) * 100
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{item.category}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ${item.amount.toFixed(2)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Trends</h3>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{month.month}</span>
                  <span className="text-sm text-muted-foreground">
                    ${month.amount} ({month.count} transactions)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${(month.amount / 1600) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Merchants */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Merchants</h3>
        <div className="space-y-3">
          {topMerchants.map((merchant, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{merchant.merchant}</p>
                  <p className="text-sm text-muted-foreground">{merchant.count} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">${merchant.amount.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <h4 className="font-medium text-success">Positive Trend</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Your spending has decreased by 12% compared to last month.
            </p>
          </div>
          
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-warning" />
              <h4 className="font-medium text-warning">High Spending</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Food & Dining accounts for 35% of your total spending this month.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
