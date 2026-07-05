import React from 'react'
import { LucideIcon } from 'lucide-react'

/** Small shared building blocks used across pages. */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: 'default' | 'positive' | 'negative'
}) {
  const valueColor =
    tone === 'positive' ? 'text-success-600 dark:text-success-400' : tone === 'negative' ? 'text-danger-600 dark:text-danger-400' : 'text-foreground'
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  children,
}: {
  icon: LucideIcon
  title: string
  message: string
  children?: React.ReactNode
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {children && <div className="mt-5 flex gap-2">{children}</div>}
    </div>
  )
}

export function CategoryPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}

export function ProgressBar({ ratio, color }: { ratio: number; color?: string }) {
  const pct = Math.min(ratio * 100, 100)
  const barColor = color ?? (ratio > 1 ? '#ef4444' : ratio >= 0.8 ? '#f59e0b' : '#22c55e')
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="card relative z-10 w-full max-w-lg animate-slide-up p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  )
}
