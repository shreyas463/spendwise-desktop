import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Download } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import {
  categoryBreakdown,
  monthlyTrend,
  stackedByCategory,
  topMerchants,
} from '../core/analytics'
import { currentMonthKey, monthBounds, shiftMonth } from '../core/dates'
import { formatCompact, formatCurrency } from '../utils/formatters'
import { EmptyState, PageHeader } from '../components/ui'
import ImportButton from '../components/ImportButton'
import { TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from '../utils/chart'

const RANGES = [
  { key: '3m', label: '3 months', months: 3 },
  { key: '6m', label: '6 months', months: 6 },
  { key: '12m', label: '12 months', months: 12 },
] as const

export default function Analytics() {
  const { store, exportCsv } = useData()
  const { transactions, categories, settings } = store
  const currency = settings.currency
  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]['key']>('6m')

  const months = RANGES.find((r) => r.key === rangeKey)!.months
  const endMonth = currentMonthKey()
  const startMonth = shiftMonth(endMonth, -(months - 1))
  const range = { start: monthBounds(startMonth).start, end: monthBounds(endMonth).end }

  const slices = useMemo(() => categoryBreakdown(transactions, categories, range), [transactions, categories, rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const trend = useMemo(() => monthlyTrend(transactions, categories, months), [transactions, categories, months])
  const merchants = useMemo(() => topMerchants(transactions, categories, range, 10), [transactions, categories, rangeKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const stacked = useMemo(() => stackedByCategory(transactions, categories, months), [transactions, categories, months])

  if (transactions.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <EmptyState icon={BarChart3} title="No data to analyze" message="Import transactions to see spending breakdowns, trends, and top merchants.">
          <ImportButton />
        </EmptyState>
      </div>
    )
  }

  const exportBreakdown = () =>
    exportCsv(
      ['Category', 'Amount', 'Share %', 'Transactions'],
      slices.map((s) => [s.name, s.amount, s.percentage, s.count]),
      'spendwise-category-breakdown.csv',
    )
  const exportTrend = () =>
    exportCsv(
      ['Month', 'Spent', 'Income', 'Transactions'],
      trend.map((m) => [m.label, m.spent, m.income, m.count]),
      'spendwise-monthly-trend.csv',
    )
  const exportMerchants = () =>
    exportCsv(
      ['Merchant', 'Amount', 'Transactions'],
      merchants.map((m) => [m.merchant, m.amount, m.count]),
      'spendwise-top-merchants.csv',
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Where your money goes"
        actions={
          <div className="glass flex gap-1 rounded-xl border p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeKey(r.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  rangeKey === r.key
                    ? 'bg-brand text-white shadow-glow'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category breakdown */}
        <ChartCard title={`Spending by category (${months} months)`} onExport={exportBreakdown}>
          {slices.length === 0 ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={100}
                  paddingAngle={3}
                  cornerRadius={6}
                  stroke="none"
                >
                  {slices.map((s) => (
                    <Cell key={s.categoryId} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Monthly totals + counts */}
        <ChartCard title="Monthly spend & activity" onExport={exportTrend}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={trend} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="gBarSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="amt" tickFormatter={formatCompact} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={52} />
              <YAxis yAxisId="cnt" orientation="right" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                formatter={(v: number, name: string) => (name === 'Transactions' ? v : formatCurrency(v, currency))}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
              />
              <Legend iconType="circle" iconSize={8} />
              <Bar yAxisId="amt" dataKey="spent" name="Spent" fill="url(#gBarSpent)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              <Line yAxisId="cnt" type="monotone" dataKey="count" name="Transactions" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Stacked categories over time */}
        <ChartCard title="Category mix over time">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stacked.data} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={52} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v, currency)}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
              />
              <Legend iconType="circle" iconSize={8} />
              {stacked.series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="a"
                  fill={s.color}
                  radius={i === stacked.series.length - 1 ? [5, 5, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top merchants */}
        <ChartCard title="Top merchants" onExport={exportMerchants}>
          {merchants.length === 0 ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={merchants.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 16 }}>
                <defs>
                  <linearGradient id="gMerchant" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.75} />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <XAxis type="number" tickFormatter={formatCompact} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="merchant" width={130} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v, currency)}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                />
                <Bar dataKey="amount" name="Spent" fill="url(#gMerchant)" radius={[0, 6, 6, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, onExport, children }: { title: string; onExport?: () => void; children: React.ReactNode }) {
  return (
    <div className="card hover-lift animate-fade-up p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {onExport && (
          <button
            onClick={onExport}
            title="Export as CSV"
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function NoData() {
  return <p className="py-20 text-center text-sm text-muted-foreground">No spending in this period.</p>
}
