import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// --------- File operations ---------
contextBridge.exposeInMainWorld('electronAPI', {
  selectCSVFile: () => ipcRenderer.invoke('select-csv-file'),
  saveCSVFile: (data: string, filename: string) => ipcRenderer.invoke('save-csv-file', data, filename),
})

// --------- Theme management ---------
contextBridge.exposeInMainWorld('themeAPI', {
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: string) => ipcRenderer.invoke('set-theme', theme),
})

// --------- App info ---------
contextBridge.exposeInMainWorld('appAPI', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => process.platform,
})
