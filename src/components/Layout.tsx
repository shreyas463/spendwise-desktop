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

  // Resolve the effective theme reactively from settings (+ system preference)
  // rather than reading the DOM, so the toggle label/icon never go stale.
  const pref = store.settings.theme
  const [systemDark, setSystemDark] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const isDark = pref === 'dark' || (pref === 'system' && systemDark)
  const toggleTheme = () => updateSettings({ theme: isDark ? 'light' : 'dark' })

  const overBudget = budgetStatus(store.transactions, store.categories, store.budgets).filter(
    (b) => b.state === 'over',
  ).length

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-40 flex w-60 flex-col">
        <div className="glass m-3 flex flex-grow flex-col rounded-2xl border shadow-soft">
          <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
            <div className="bg-brand flex h-9 w-9 items-center justify-center rounded-xl shadow-glow">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Spend<span className="text-gradient">Wise</span>
            </h1>
          </div>

          <nav className="mt-1 flex-1 px-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative my-1 flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand text-white shadow-glow'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-[18px] w-[18px] transition-transform duration-200 ${
                      isActive ? '' : 'group-hover:scale-110'
                    }`}
                  />
                  {item.name}
                  {item.href === '/budgets' && overBudget > 0 && (
                    <span
                      className={`ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-semibold ${
                        isActive ? 'bg-white/25 text-white' : 'bg-danger-500 text-white'
                      }`}
                    >
                      {overBudget}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="p-3">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isDark ? <Sun className="mr-3 h-[18px] w-[18px]" /> : <Moon className="mr-3 h-[18px] w-[18px]" />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-60">
        <main key={location.pathname} className="mx-auto max-w-6xl animate-fade-in p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
