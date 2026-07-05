import { contextBridge, ipcRenderer } from 'electron'

/**
 * The complete surface the renderer may touch. Typed on the renderer side in
 * src/services/backend.ts (SpendWiseBridge).
 */
const api = {
  readStore: (): Promise<unknown> => ipcRenderer.invoke('store:read'),
  writeStore: (data: unknown): Promise<boolean> => ipcRenderer.invoke('store:write', data),
  openCsvFiles: (): Promise<{ name: string; content: string }[]> => ipcRenderer.invoke('dialog:open-csv'),
  saveFile: (content: string, defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:save-file', content, defaultName),
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  platform: process.platform,
}

contextBridge.exposeInMainWorld('spendwise', api)

export type SpendWiseApi = typeof api
