import { useEffect, useState } from 'react'
import { Database, Download, Paintbrush, Sparkles, Trash2, Wand2, X } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { bridge, isElectron } from '../services/backend'
import { Modal, PageHeader } from '../components/ui'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'CHF']

export default function Settings() {
  const { store, updateSettings, addRule, deleteRule, loadDemoData, clearAllData, exportBackup } = useData()
  const { settings, rules, categories, transactions } = store
  const userRules = rules.filter((r) => r.origin === 'user')

  const [version, setVersion] = useState('')
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [newMatch, setNewMatch] = useState('')
  const [newRuleCategory, setNewRuleCategory] = useState(categories[0]?.id ?? '')

  useEffect(() => {
    void bridge.getVersion().then(setVersion)
  }, [])

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" />

      {/* Appearance */}
      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <Paintbrush className="h-4 w-4" /> Appearance
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Theme</label>
            <select
              className="input mt-1.5"
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as typeof settings.theme })}
            >
              <option value="system">Follow system</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label className="label">Currency</label>
            <select
              className="input mt-1.5"
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Categorization rules */}
      <section className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
          <Wand2 className="h-4 w-4" /> Categorization rules
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Your rules run before the {rules.length - userRules.length} built-in merchant rules and re-categorize
          existing transactions when added or removed.
        </p>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="label">When description contains</label>
            <input
              className="input mt-1.5"
              placeholder="e.g. blue bottle"
              value={newMatch}
              onChange={(e) => setNewMatch(e.target.value)}
            />
          </div>
          <div className="w-52">
            <label className="label">Assign category</label>
            <select className="input mt-1.5" value={newRuleCategory} onChange={(e) => setNewRuleCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary h-10 px-4"
            disabled={newMatch.trim().length < 2}
            onClick={() => {
              addRule(newMatch, newRuleCategory, true)
              setNewMatch('')
            }}
          >
            Add rule
          </button>
        </div>

        {userRules.length > 0 ? (
          <ul className="divide-y rounded-md border">
            {userRules.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-foreground">
                  “<span className="font-medium">{r.match}</span>” →{' '}
                  {categories.find((c) => c.id === r.categoryId)?.name ?? r.categoryId}
                </span>
                <button
                  title="Delete rule"
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-danger-500"
                  onClick={() => deleteRule(r.id, true)}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No custom rules yet. Tip: hover a transaction on the Transactions page and click the wand to create one.
          </p>
        )}
      </section>

      {/* Data */}
      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <Database className="h-4 w-4" /> Data
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {transactions.length} transactions stored locally
          {isElectron ? ' in your system user-data folder' : ' in this browser (web preview mode)'}. Nothing ever
          leaves your machine.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline h-9 px-4" onClick={() => void exportBackup()}>
            <Download className="mr-2 h-4 w-4" /> Export backup (JSON)
          </button>
          <button className="btn btn-outline h-9 px-4" onClick={loadDemoData}>
            <Sparkles className="mr-2 h-4 w-4" /> Load demo data
          </button>
          <button
            className="btn h-9 border border-danger-300 px-4 text-danger-600 hover:bg-danger-50 dark:border-danger-700 dark:text-danger-400 dark:hover:bg-danger-900/20"
            onClick={() => setConfirmWipe(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Erase all data
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">SpendWise {version && `v${version.replace(/^v/, '')}`}</p>

      {confirmWipe && (
        <Modal title="Erase all data?" onClose={() => setConfirmWipe(false)}>
          <p className="text-sm text-muted-foreground">
            This permanently deletes all {transactions.length} transactions, custom rules, budgets, and chat history.
            Consider exporting a backup first.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn btn-outline h-9 px-4" onClick={() => setConfirmWipe(false)}>
              Cancel
            </button>
            <button
              className="btn h-9 bg-danger-600 px-4 text-white hover:bg-danger-700"
              onClick={() => {
                clearAllData()
                setConfirmWipe(false)
              }}
            >
              Erase everything
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
