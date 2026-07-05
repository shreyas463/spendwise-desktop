import { useState } from 'react'
import { PiggyBank, Trash2 } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { budgetStatus } from '../core/analytics'
import { currentMonthKey, monthLabel } from '../core/dates'
import { formatCurrency } from '../utils/formatters'
import { PageHeader, ProgressBar } from '../components/ui'

export default function Budgets() {
  const { store, setBudget, removeBudget } = useData()
  const { transactions, categories, budgets, settings } = store
  const currency = settings.currency
  const month = currentMonthKey()

  const statuses = budgetStatus(transactions, categories, budgets, month)
  const budgeted = new Set(budgets.map((b) => b.categoryId))
  const available = categories.filter((c) => c.kind === 'expense' && !budgeted.has(c.id))

  const [newCategory, setNewCategory] = useState('')
  const [newLimit, setNewLimit] = useState('')

  const addBudget = () => {
    const limit = Number(newLimit)
    if (!newCategory || !(limit > 0)) return
    setBudget(newCategory, limit)
    setNewCategory('')
    setNewLimit('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        subtitle={`Monthly category limits — tracking ${monthLabel(month)}`}
      />

      {/* Add budget */}
      <div className="card p-5">
        <h2 className="mb-3 text-base font-semibold text-foreground">Set a budget</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="label">Category</label>
            <select className="input mt-1.5" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              <option value="">Choose a category…</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="label">Monthly limit</label>
            <input
              type="number"
              min="0"
              step="10"
              placeholder="500"
              className="input mt-1.5"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBudget()}
            />
          </div>
          <button className="btn btn-primary h-10 px-4" disabled={!newCategory || !(Number(newLimit) > 0)} onClick={addBudget}>
            Add budget
          </button>
        </div>
      </div>

      {/* Budget list */}
      {statuses.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <PiggyBank className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No budgets yet</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Set a monthly limit for a category above. SpendWise tracks progress and warns you at 80% — and the
            sidebar shows a badge when you go over.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {statuses.map((b) => {
            const stateLabel =
              b.state === 'over'
                ? `Over by ${formatCurrency(b.spent - b.limit, currency)}`
                : b.state === 'warning'
                  ? 'Approaching limit'
                  : 'On track'
            const stateColor =
              b.state === 'over'
                ? 'text-danger-600 dark:text-danger-400'
                : b.state === 'warning'
                  ? 'text-warning-600 dark:text-warning-400'
                  : 'text-success-600 dark:text-success-400'
            return (
              <div key={b.categoryId} className="card p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="font-medium text-foreground">{b.name}</span>
                    <span className={`text-xs font-medium ${stateColor}`}>{stateLabel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatCurrency(b.spent, currency)} of{' '}
                      <EditableLimit value={b.limit} currency={currency} onChange={(v) => setBudget(b.categoryId, v)} />
                    </span>
                    <button
                      title="Remove budget"
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-danger-500"
                      onClick={() => removeBudget(b.categoryId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <ProgressBar ratio={b.ratio} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EditableLimit({
  value,
  currency,
  onChange,
}: {
  value: number
  currency: string
  onChange: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  if (!editing) {
    return (
      <button
        className="font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
        title="Click to edit limit"
        onClick={() => {
          setDraft(String(value))
          setEditing(true)
        }}
      >
        {formatCurrency(value, currency)}
      </button>
    )
  }
  const commit = () => {
    const n = Number(draft)
    if (n > 0) onChange(n)
    setEditing(false)
  }
  return (
    <input
      autoFocus
      type="number"
      className="input inline-block h-7 w-24 px-2 py-0 text-sm"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') setEditing(false)
      }}
    />
  )
}
