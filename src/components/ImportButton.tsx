import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react'
import { ImportSummary, useData } from '../contexts/DataContext'
import { Modal } from './ui'

/**
 * "Import CSV" button + result dialog. Opens the native file picker in
 * Electron (browser file input in web preview), parses, categorizes,
 * de-duplicates, and reports what happened per file.
 */
export default function ImportButton({ variant = 'primary' }: { variant?: 'primary' | 'outline' }) {
  const { importFromFilePicker } = useData()
  const [results, setResults] = useState<ImportSummary[] | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      const summaries = await importFromFilePicker()
      if (summaries.length > 0) setResults(summaries)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={run}
        disabled={busy}
        className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-outline'} h-9 px-4`}
      >
        <Upload className="mr-2 h-4 w-4" />
        {busy ? 'Importing…' : 'Import CSV'}
      </button>

      {results && (
        <Modal title="Import results" onClose={() => setResults(null)}>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border p-3">
                {r.error ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-500" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{r.fileName}</p>
                  {r.error ? (
                    <p className="text-sm text-danger-600 dark:text-danger-400">{r.error}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {r.imported} imported
                      {r.duplicates > 0 && `, ${r.duplicates} duplicate${r.duplicates === 1 ? '' : 's'} skipped`}
                      {r.skipped > 0 && `, ${r.skipped} row${r.skipped === 1 ? '' : 's'} unreadable`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button className="btn btn-primary h-9 px-4" onClick={() => setResults(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
