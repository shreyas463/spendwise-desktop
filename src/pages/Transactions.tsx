import { useMemo, useState } from 'react'
import { Download, Inbox, Plus, Search, Trash2, Wand2 } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { Transaction } from '../core/types'
import { todayIso } from '../core/dates'
import { formatCurrency, formatDate } from '../utils/formatters'
import { EmptyState, Modal, PageHeader } from '../components/ui'
import ImportButton from '../components/ImportButton'

const PAGE_SIZE = 50

export default function Transactions() {
  const { store, updateTransaction, deleteTransaction, addTransaction, addRule, exportCsv } = useData()
  const { transactions, categories, settings } = store
  const currency = settings.currency

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [adding, setAdding] = useState(false)
  const [ruleFor, setRuleFor] = useState<Transaction | null>(null)

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return transactions.filter((t) => {
      if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false
      if (!q) return true
      return (
        t.description.toLowerCase().includes(q) ||
        t.merchant.toLowerCase().includes(q) ||
        t.date.includes(q) ||
        String(Math.abs(t.amount)).includes(q)
      )
    })
  }, [transactions, search, categoryFilter])

  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const doExport = () =>
    exportCsv(
      ['Date', 'Description', 'Merchant', 'Amount', 'Category', 'Account'],
      filtered.map((t) => [
        t.date,
        t.description,
        t.merchant,
        t.amount,
        catById.get(t.categoryId)?.name ?? t.categoryId,
        t.account ?? '',
      ]),
      'spendwise-transactions.csv',
    )

  if (transactions.length === 0) {
    return (
      <div>
        <PageHeader title="Transactions" />
        <EmptyState
          icon={Inbox}
          title="Nothing here yet"
          message="Import a CSV from your bank, or add a transaction manually."
        >
          <ImportButton />
          <button className="btn btn-outline h-9 px-4" onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add manually
          </button>
        </EmptyState>
        {adding && <AddTransactionModal onClose={() => setAdding(false)} onAdd={addTransaction} categories={categories} />}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${filtered.length} of ${transactions.length} transactions`}
        actions={
          <>
            <button className="btn btn-outline h-9 px-4" onClick={doExport}>
              <Download className="mr-2 h-4 w-4" /> Export
            </button>
            <button className="btn btn-outline h-9 px-4" onClick={() => setAdding(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </button>
            <ImportButton />
          </>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="input pl-9"
            placeholder="Search description, merchant, date…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <select
          className="input w-48"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(0)
          }}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {pageRows.map((t) => (
              <tr key={t.id} className="group hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{formatDate(t.date)}</td>
                <td className="max-w-[340px] px-4 py-2.5">
                  <p className="truncate font-medium text-foreground" title={t.description}>
                    {t.merchant}
                  </p>
                  <p className="truncate text-xs text-muted-foreground" title={t.description}>
                    {t.description}
                  </p>
                </td>
                <td className="px-4 py-2.5">
                  <select
                    className="rounded-md border-none bg-transparent py-1 pl-1 pr-6 text-sm text-foreground hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
                    value={t.categoryId}
                    onChange={(e) => updateTransaction(t.id, { categoryId: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums ${
                    t.amount >= 0 ? 'text-success-600 dark:text-success-400' : 'text-foreground'
                  }`}
                >
                  {formatCurrency(t.amount, currency, { signed: true })}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      title="Create a rule from this transaction"
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setRuleFor(t)}
                    >
                      <Wand2 className="h-4 w-4" />
                    </button>
                    <button
                      title="Delete transaction"
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-danger-500"
                      onClick={() => deleteTransaction(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No transactions match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button className="btn btn-outline h-8 px-3" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button
              className="btn btn-outline h-8 px-3"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {adding && <AddTransactionModal onClose={() => setAdding(false)} onAdd={addTransaction} categories={categories} />}
      {ruleFor && (
        <CreateRuleModal
          transaction={ruleFor}
          categories={categories}
          onClose={() => setRuleFor(null)}
          onCreate={(match, categoryId) => {
            addRule(match, categoryId, true)
            setRuleFor(null)
          }}
        />
      )}
    </div>
  )
}

function AddTransactionModal({
  onClose,
  onAdd,
  categories,
}: {
  onClose: () => void
  onAdd: (t: { date: string; description: string; amount: number; categoryId?: string }) => void
  categories: { id: string; name: string }[]
}) {
  const [date, setDate] = useState(todayIso())
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [categoryId, setCategoryId] = useState('')

  const valid = description.trim().length > 0 && Number(amount) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date)

  const submit = () => {
    const n = Math.abs(Number(amount))
    onAdd({
      date,
      description: description.trim(),
      amount: type === 'expense' ? -n : n,
      categoryId: categoryId || undefined,
    })
    onClose()
  }

  return (
    <Modal title="Add transaction" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input mt-1.5" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="input mt-1.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input
            className="input mt-1.5"
            placeholder="e.g. Dinner at Luigi's"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input mt-1.5" value={type} onChange={(e) => setType(e.target.value as 'expense' | 'income')}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input mt-1.5" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Auto-detect</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn btn-outline h-9 px-4" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary h-9 px-4" disabled={!valid} onClick={submit}>
            Add
          </button>
        </div>
      </div>
    </Modal>
  )
}

function CreateRuleModal({
  transaction,
  categories,
  onClose,
  onCreate,
}: {
  transaction: Transaction
  categories: { id: string; name: string }[]
  onClose: () => void
  onCreate: (match: string, categoryId: string) => void
}) {
  const [match, setMatch] = useState(transaction.merchant.toLowerCase())
  const [categoryId, setCategoryId] = useState(transaction.categoryId)

  return (
    <Modal title="Create categorization rule" onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">
        Every transaction whose description contains the text below will be assigned to the chosen category —
        including existing ones.
      </p>
      <div className="space-y-4">
        <div>
          <label className="label">When description contains</label>
          <input className="input mt-1.5" value={match} onChange={(e) => setMatch(e.target.value)} />
        </div>
        <div>
          <label className="label">Assign category</label>
          <select className="input mt-1.5" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn btn-outline h-9 px-4" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary h-9 px-4"
            disabled={match.trim().length < 2}
            onClick={() => onCreate(match, categoryId)}
          >
            Create rule
          </button>
        </div>
      </div>
    </Modal>
  )
}
