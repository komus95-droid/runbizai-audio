import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function getDataDir(): string {
  const dir = path.join(app.getPath('userData'), 'runbizai-data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function dataPath(file: string): string {
  return path.join(getDataDir(), file)
}

function loadJson<T>(file: string, fallback: T): T {
  try {
    const p = dataPath(file)
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {}
  return fallback
}

function saveJson(file: string, data: unknown): void {
  fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2), 'utf-8')
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'RunBizAI',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false,
    titleBarStyle: 'default'
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.once('ready-to-show', () => win.show())
  return win
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: Schedule
ipcMain.handle('schedule:load', () => loadJson('schedule.json', {}))
ipcMain.handle('schedule:save', (_e, data) => { saveJson('schedule.json', data); return true })

// IPC: EQ presets
ipcMain.handle('eq:load', () => loadJson('eq-presets.json', { presets: {}, active: 'Нейтрал' }))
ipcMain.handle('eq:save', (_e, data) => { saveJson('eq-presets.json', data); return true })

// IPC: Library (playlists / announcements)
ipcMain.handle('library:load', () => loadJson('library.json', { playlists: [], announcements: [] }))
ipcMain.handle('library:save', (_e, data) => { saveJson('library.json', data); return true })

// IPC: Pick folder dialog
ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (result.canceled || !result.filePaths.length) return null
  return result.filePaths[0]
})

// IPC: Pick files dialog
ipcMain.handle('dialog:pickFiles', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a'] }]
  })
  if (result.canceled) return []
  return result.filePaths
})

// IPC: Scan folder for audio files
ipcMain.handle('fs:scanFolder', (_e, folderPath: string) => {
  try {
    if (!fs.existsSync(folderPath)) return []
    const exts = ['.mp3', '.wav', '.ogg', '.flac', '.m4a']
    return fs.readdirSync(folderPath)
      .filter(f => exts.includes(path.extname(f).toLowerCase()))
      .map(f => ({ name: path.basename(f, path.extname(f)), path: path.join(folderPath, f) }))
  } catch {
    return []
  }
})

// IPC: Open data folder in Explorer
ipcMain.handle('shell:openDataDir', () => shell.openPath(getDataDir()))
