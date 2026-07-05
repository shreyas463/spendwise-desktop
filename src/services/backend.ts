import { Store } from '../core/types'

/**
 * Runtime bridge between the renderer and its host.
 *
 * In Electron, `window.spendwise` (exposed by the preload script) provides
 * durable storage in the OS user-data directory plus native file dialogs.
 * In a plain browser (`npm run dev:web`, tests, previews) we fall back to
 * localStorage and <input type=file> / download-link equivalents, so the
 * whole UI is developable and testable without launching Electron.
 */

export interface SpendWiseBridge {
  readStore: () => Promise<unknown>
  writeStore: (data: unknown) => Promise<boolean>
  openCsvFiles: () => Promise<{ name: string; content: string }[]>
  saveFile: (content: string, defaultName: string) => Promise<string | null>
  getVersion: () => Promise<string>
  platform: string
}

declare global {
  interface Window {
    spendwise?: SpendWiseBridge
  }
}

export const isElectron = typeof window !== 'undefined' && !!window.spendwise

const LS_KEY = 'spendwise-store'

const browserBridge: SpendWiseBridge = {
  async readStore() {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  async writeStore(data: unknown) {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
    return true
  },
  openCsvFiles() {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.csv,.txt,text/csv'
      input.multiple = true
      input.onchange = async () => {
        const files = [...(input.files ?? [])]
        resolve(await Promise.all(files.map(async (f) => ({ name: f.name, content: await f.text() }))))
      }
      // If the picker is dismissed we simply never resolve with files; treat
      // focus return without change as cancel.
      input.oncancel = () => resolve([])
      input.click()
    })
  },
  async saveFile(content: string, defaultName: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = defaultName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    return defaultName
  },
  async getVersion() {
    return '1.0.0 (web preview)'
  },
  platform: 'web',
}

export const bridge: SpendWiseBridge = (typeof window !== 'undefined' && window.spendwise) || browserBridge

export async function loadStore(): Promise<unknown> {
  return bridge.readStore()
}

let pending: Store | null = null
let timer: ReturnType<typeof setTimeout> | null = null

/** Debounced persistence — rapid edits collapse into one disk write. */
export function persistStore(store: Store): void {
  pending = store
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    const p = pending
    pending = null
    timer = null
    if (p) void bridge.writeStore(p)
  }, 250)
}

/** Flush any debounced write immediately (e.g. before data export). */
export async function flushStore(): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (pending) {
    const p = pending
    pending = null
    await bridge.writeStore(p)
  }
}
