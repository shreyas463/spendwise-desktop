import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  CreditCard,
  Home,
  MessageSquare,
  Moon,
  PiggyBank,
  Settings,
  Sun,
  Wallet,
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { budgetStatus } from '../core/analytics'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Budgets', href: '/budgets', icon: PiggyBank },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { store, updateSettings } = useData()

  const isDark = document.documentElement.classList.contains('dark')
  const toggleTheme = () => updateSettings({ theme: isDark ? 'light' : 'dark' })

  const overBudget = budgetStatus(store.transactions, store.categories, store.budgets).filter(
    (b) => b.state === 'over',
  ).length

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 flex w-56 flex-col">
        <div className="flex flex-grow flex-col border-r bg-card">
          <div className="flex items-center gap-2 px-4 pb-4 pt-8">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">SpendWise</h1>
          </div>
          <nav className="mt-2 flex-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative mx-2 my-0.5 flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.href === '/budgets' && overBudget > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger-500 px-1 text-xs font-semibold text-white">
                      {overBudget}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-3">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isDark ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-56">
        <main className="mx-auto max-w-6xl p-8">{children}</main>
      </div>
    </div>
  )
}
