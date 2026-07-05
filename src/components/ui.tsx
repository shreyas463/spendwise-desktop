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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
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
  accent = 'hsl(var(--primary))',
  delay = 0,
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: 'default' | 'positive' | 'negative'
  /** color used for the icon chip + corner glow */
  accent?: string
  /** entrance-animation delay in ms, for staggered grids */
  delay?: number
}) {
  const valueColor =
    tone === 'positive'
      ? 'text-success-600 dark:text-success-400'
      : tone === 'negative'
        ? 'text-danger-600 dark:text-danger-400'
        : 'text-foreground'
  return (
    <div className="card hover-lift animate-fade-up relative overflow-hidden p-5" style={{ animationDelay: `${delay}ms` }}>
      {/* corner glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className={`mt-3 text-[26px] font-bold leading-none tabular-nums ${valueColor}`}>{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
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
    <div className="card animate-scale-in flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="bg-brand/10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
        <span className="flex h-full w-full items-center justify-center rounded-2xl bg-accent">
          <Icon className="h-7 w-7 text-primary" />
        </span>
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{message}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}

export function CategoryPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${color}1f`, color, boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}

export function ProgressBar({ ratio, color }: { ratio: number; color?: string }) {
  const pct = Math.min(ratio * 100, 100)
  const fallback = ratio > 1 ? '#ef4444' : ratio >= 0.8 ? '#f59e0b' : '#22c55e'
  const barColor = color ?? fallback
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${pct}%`,
          backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${barColor} 70%, white), ${barColor})`,
        }}
      />
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
      <div className="animate-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="glass animate-scale-in relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-lift">
        <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  )
}
