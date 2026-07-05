import { BrowserWindow, app, dialog, ipcMain, shell } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Thin main process. All business logic lives in the renderer (src/core);
 * the main process only owns the window, native dialogs, and durable
 * storage — a single JSON document written atomically to userData.
 */

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

const storeFile = () => path.join(app.getPath('userData'), 'spendwise-data.json')

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 940,
    minHeight: 640,
    title: 'SpendWise',
    backgroundColor: '#0b1120',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
  })

  // Open external links in the system browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    if (url !== win?.webContents.getURL()) e.preventDefault()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.once('ready-to-show', () => win?.show())
  win.on('closed', () => {
    win = null
  })
}

// ---------------------------------------------------------------------------
// Storage: read/write the whole document, atomic replace on write.
// ---------------------------------------------------------------------------

ipcMain.handle('store:read', async () => {
  try {
    const text = await fs.readFile(storeFile(), 'utf8')
    return JSON.parse(text)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return null
    // Corrupt file: keep it for forensics, start fresh
    try {
      await fs.copyFile(storeFile(), `${storeFile()}.corrupt-${Date.now()}`)
    } catch {
      /* ignore */
    }
    return null
  }
})

ipcMain.handle('store:write', async (_e, data: unknown) => {
  const file = storeFile()
  const tmp = `${file}.tmp`
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(tmp, JSON.stringify(data), 'utf8')
  await fs.rename(tmp, file)
  return true
})

// ---------------------------------------------------------------------------
// Native dialogs
// ---------------------------------------------------------------------------

ipcMain.handle('dialog:open-csv', async () => {
  if (!win) return []
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'CSV Files', extensions: ['csv', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (result.canceled) return []
  const files: { name: string; content: string }[] = []
  for (const p of result.filePaths) {
    files.push({ name: path.basename(p), content: await fs.readFile(p, 'utf8') })
  }
  return files
})

ipcMain.handle('dialog:save-file', async (_e, content: string, defaultName: string) => {
  if (!win) return null
  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (result.canceled || !result.filePath) return null
  await fs.writeFile(result.filePath, content, 'utf8')
  return result.filePath
})

ipcMain.handle('app:version', () => app.getVersion())

// ---------------------------------------------------------------------------

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.whenReady().then(createWindow)
}
