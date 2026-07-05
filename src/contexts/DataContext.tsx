import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Budget, ChatMessage, Rule, Settings, Store, Transaction, makeId } from '../core/types'
import { createDefaultStore, migrateStore, buildImport, applyRules } from '../core/store'
import { importCsv, toCsv } from '../core/csv'
import { extractMerchant, categorize } from '../core/categorize'
import { generateDemoData } from '../core/demo'
import { answerQuery } from '../core/query'
import { bridge, flushStore, loadStore, persistStore } from '../services/backend'

export interface ImportSummary {
  fileName: string
  imported: number
  duplicates: number
  skipped: number
  error?: string
}

interface DataContextType {
  ready: boolean
  store: Store
  /** Import via native/browser file picker. Returns one summary per file. */
  importFromFilePicker: () => Promise<ImportSummary[]>
  importCsvText: (fileName: string, text: string) => ImportSummary
  addTransaction: (t: { date: string; description: string; amount: number; categoryId?: string; account?: string }) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addRule: (match: string, categoryId: string, recategorize: boolean) => void
  deleteRule: (id: string, recategorize: boolean) => void
  setBudget: (categoryId: string, monthlyLimit: number) => void
  removeBudget: (categoryId: string) => void
  updateSettings: (updates: Partial<Settings>) => void
  sendChatMessage: (text: string) => void
  clearChat: () => void
  loadDemoData: () => void
  clearAllData: () => void
  exportCsv: (columns: string[], rows: (string | number)[][], filename: string) => Promise<string | null>
  exportBackup: () => Promise<string | null>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(createDefaultStore)
  const [ready, setReady] = useState(false)

  // Initial load from disk (Electron) or localStorage (web preview)
  useEffect(() => {
    let cancelled = false
    void loadStore().then((raw) => {
      if (cancelled) return
      setStore(migrateStore(raw))
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist every change after the initial load
  useEffect(() => {
    if (ready) persistStore(store)
  }, [store, ready])

  // Apply theme
  useEffect(() => {
    const apply = () => {
      const pref = store.settings.theme
      const dark =
        pref === 'dark' ||
        (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [store.settings.theme])

  const mutate = useCallback((fn: (prev: Store) => Store) => {
    setStore((prev) => fn(prev))
  }, [])

  const importCsvText = useCallback(
    (fileName: string, text: string): ImportSummary => {
      let summary: ImportSummary = { fileName, imported: 0, duplicates: 0, skipped: 0 }
      try {
        const parsed = importCsv(text)
        setStore((prev) => {
          const result = buildImport(parsed.rows, prev.transactions, prev.rules)
          summary = {
            fileName,
            imported: result.imported,
            duplicates: result.duplicates,
            skipped: parsed.skipped.length,
          }
          if (result.transactions.length === 0) return prev
          return {
            ...prev,
            transactions: [...result.transactions, ...prev.transactions].sort((a, b) =>
              a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
            ),
          }
        })
      } catch (err) {
        summary = { fileName, imported: 0, duplicates: 0, skipped: 0, error: err instanceof Error ? err.message : String(err) }
      }
      return summary
    },
    [],
  )

  const importFromFilePicker = useCallback(async (): Promise<ImportSummary[]> => {
    const files = await bridge.openCsvFiles()
    return files.map((f) => importCsvText(f.name, f.content))
  }, [importCsvText])

  const addTransaction: DataContextType['addTransaction'] = useCallback(
    (t) => {
      mutate((prev) => {
        const merchant = extractMerchant(t.description)
        const tx: Transaction = {
          id: makeId(),
          date: t.date,
          description: t.description,
          merchant,
          amount: Math.round(t.amount * 100) / 100,
          categoryId: t.categoryId || categorize(t.description, merchant, prev.rules),
          account: t.account,
          source: 'manual',
        }
        return {
          ...prev,
          transactions: [tx, ...prev.transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
        }
      })
    },
    [mutate],
  )

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      mutate((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...updates, id: t.id } : t)),
      }))
    },
    [mutate],
  )

  const deleteTransaction = useCallback(
    (id: string) => {
      mutate((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }))
    },
    [mutate],
  )

  const addRule = useCallback(
    (match: string, categoryId: string, recategorize: boolean) => {
      mutate((prev) => {
        const rule: Rule = { id: makeId(), match: match.trim(), categoryId, origin: 'user' }
        const rules = [rule, ...prev.rules]
        return {
          ...prev,
          rules,
          transactions: recategorize ? applyRules(prev.transactions, rules) : prev.transactions,
        }
      })
    },
    [mutate],
  )

  const deleteRule = useCallback(
    (id: string, recategorize: boolean) => {
      mutate((prev) => {
        const rules = prev.rules.filter((r) => r.id !== id)
        return {
          ...prev,
          rules,
          transactions: recategorize ? applyRules(prev.transactions, rules) : prev.transactions,
        }
      })
    },
    [mutate],
  )

  const setBudget = useCallback(
    (categoryId: string, monthlyLimit: number) => {
      mutate((prev) => {
        const others = prev.budgets.filter((b) => b.categoryId !== categoryId)
        const budgets: Budget[] = monthlyLimit > 0 ? [...others, { categoryId, monthlyLimit }] : others
        return { ...prev, budgets }
      })
    },
    [mutate],
  )

  const removeBudget = useCallback(
    (categoryId: string) => {
      mutate((prev) => ({ ...prev, budgets: prev.budgets.filter((b) => b.categoryId !== categoryId) }))
    },
    [mutate],
  )

  const updateSettings = useCallback(
    (updates: Partial<Settings>) => {
      mutate((prev) => ({ ...prev, settings: { ...prev.settings, ...updates } }))
    },
    [mutate],
  )

  const sendChatMessage = useCallback(
    (text: string) => {
      mutate((prev) => {
        const user: ChatMessage = { id: makeId(), role: 'user', text, at: new Date().toISOString() }
        const answer = answerQuery(text, {
          transactions: prev.transactions,
          categories: prev.categories,
          budgets: prev.budgets,
          currency: prev.settings.currency,
        })
        const assistant: ChatMessage = {
          id: makeId(),
          role: 'assistant',
          text: answer.text,
          table: answer.table,
          at: new Date().toISOString(),
        }
        // Keep history bounded
        const chatHistory = [...prev.chatHistory, user, assistant].slice(-200)
        return { ...prev, chatHistory }
      })
    },
    [mutate],
  )

  const clearChat = useCallback(() => {
    mutate((prev) => ({ ...prev, chatHistory: [] }))
  }, [mutate])

  const loadDemoData = useCallback(() => {
    mutate((prev) => {
      const withoutDemo = prev.transactions.filter((t) => t.source !== 'demo')
      return {
        ...prev,
        transactions: [...generateDemoData(), ...withoutDemo].sort((a, b) =>
          a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
        ),
      }
    })
  }, [mutate])

  const clearAllData = useCallback(() => {
    setStore((prev) => ({ ...createDefaultStore(), settings: prev.settings }))
  }, [])

  const exportCsv = useCallback(async (columns: string[], rows: (string | number)[][], filename: string) => {
    return bridge.saveFile(toCsv(columns, rows), filename)
  }, [])

  const exportBackup = useCallback(async () => {
    await flushStore()
    return bridge.saveFile(JSON.stringify(store, null, 2), 'spendwise-backup.json')
  }, [store])

  const value = useMemo<DataContextType>(
    () => ({
      ready,
      store,
      importFromFilePicker,
      importCsvText,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addRule,
      deleteRule,
      setBudget,
      removeBudget,
      updateSettings,
      sendChatMessage,
      clearChat,
      loadDemoData,
      clearAllData,
      exportCsv,
      exportBackup,
    }),
    [
      ready,
      store,
      importFromFilePicker,
      importCsvText,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addRule,
      deleteRule,
      setBudget,
      removeBudget,
      updateSettings,
      sendChatMessage,
      clearChat,
      loadDemoData,
      clearAllData,
      exportCsv,
      exportBackup,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook belong together
export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
