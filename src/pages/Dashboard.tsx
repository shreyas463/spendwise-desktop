import { Link } from 'react-router-dom'
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, Inbox, Receipt, Sparkles, TrendingUp } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { budgetStatus, categoryBreakdown, monthlyTrend, summarize } from '../core/analytics'
import { currentMonthKey, monthBounds, monthLabel, shiftMonth } from '../core/dates'
import { formatCurrency, formatDate } from '../utils/formatters'
import { CategoryPill, EmptyState, PageHeader, ProgressBar, StatCard } from '../components/ui'
import ImportButton from '../components/ImportButton'

export default function Dashboard() {
  const { store, loadDemoData } = useData()
  const { transactions, categories, budgets, settings } = store
  const currency = settings.currency

  if (transactions.length === 0) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Your money at a glance" />
        <EmptyState
          icon={Inbox}
          title="No transactions yet"
          message="Import a CSV export from your bank or credit card to get started — SpendWise parses, categorizes, and charts everything locally on your machine."
        >
          <ImportButton />
          <button className="btn btn-outline h-9 px-4" onClick={loadDemoData}>
            <Sparkles className="mr-2 h-4 w-4" />
            Load demo data
          </button>
        </EmptyState>
      </div>
    )
  }

  const month = currentMonthKey()
  const { start, end } = monthBounds(month)
  const thisMonth = summarize(transactions, categories, { start, end })
  const prevBounds = monthBounds(shiftMonth(month, -1))
  const lastMonth = summarize(transactions, categories, { start: prevBounds.start, end: prevBounds.end })
  const spendDelta = lastMonth.spent > 0 ? ((thisMonth.spent - lastMonth.spent) / lastMonth.spent) * 100 : null

  const slices = categoryBreakdown(transactions, categories, { start, end })
  const trend = monthlyTrend(transactions, categories, 6)
  const budgetStats = budgetStatus(transactions, categories, budgets, month)
  const alerts = budgetStats.filter((b) => b.state !== 'ok')
  const recent = transactions.slice(0, 8)
  const catById = new Map(categories.map((c) => [c.id, c]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Overview for ${monthLabel(month)}`}
        actions={<ImportButton />}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Spent this month"
          value={formatCurrency(thisMonth.spent, currency)}
          hint={
            spendDelta === null
              ? undefined
              : `${spendDelta >= 0 ? '+' : ''}${spendDelta.toFixed(0)}% vs ${monthLabel(shiftMonth(month, -1))}`
          }
          icon={ArrowDownRight}
          tone="negative"
        />
        <StatCard
          label="Income this month"
          value={formatCurrency(thisMonth.income, currency)}
          icon={ArrowUpRight}
          tone="positive"
        />
        <StatCard
          label="Net"
          value={formatCurrency(thisMonth.net, currency, { signed: true })}
          tone={thisMonth.net >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
        />
        <StatCard label="Transactions" value={String(thisMonth.count)} icon={Receipt} />
      </div>

      {/* Budget alerts */}
      {alerts.length > 0 && (
        <div className="card border-warning-300 bg-warning-50 p-4 dark:border-warning-700 dark:bg-warning-900/20">
          <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
            {alerts.map((a) => `${a.name}: ${Math.round(a.ratio * 100)}% of ${formatCurrency(a.limit, currency)} budget`).join(' · ')}{' '}
            — <Link to="/budgets" className="underline">review budgets</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category donut */}
        <div className="card p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">Spending by category</h2>
          {slices.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No spending recorded this month yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={slices} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {slices.map((s) => (
                    <Cell key={s.categoryId} fill={s.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 6-month trend */}
        <div className="card p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">Last 6 months</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ left: 8, right: 8 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={56} />
              <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
              <Legend iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="spent" name="Spent" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budgets snapshot */}
      {budgetStats.length > 0 && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Budgets</h2>
            <Link to="/budgets" className="text-sm text-primary hover:underline">
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgetStats.slice(0, 6).map((b) => (
              <div key={b.categoryId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{b.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrency(b.spent, currency)} / {formatCurrency(b.limit, currency)}
                  </span>
                </div>
                <ProgressBar ratio={b.ratio} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent transactions</h2>
          <Link to="/transactions" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y">
          {recent.map((t) => {
            const cat = catById.get(t.categoryId)
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{t.merchant}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {cat && <CategoryPill name={cat.name} color={cat.color} />}
                  <span
                    className={`w-24 text-right text-sm font-semibold tabular-nums ${
                      t.amount >= 0 ? 'text-success-600 dark:text-success-400' : 'text-foreground'
                    }`}
                  >
                    {formatCurrency(t.amount, currency, { signed: true })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
