import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  schedule: {
    load: () => ipcRenderer.invoke('schedule:load'),
    save: (data: unknown) => ipcRenderer.invoke('schedule:save', data)
  },
  eq: {
    load: () => ipcRenderer.invoke('eq:load'),
    save: (data: unknown) => ipcRenderer.invoke('eq:save', data)
  },
  library: {
    load: () => ipcRenderer.invoke('library:load'),
    save: (data: unknown) => ipcRenderer.invoke('library:save', data)
  },
  dialog: {
    pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
    pickFiles: () => ipcRenderer.invoke('dialog:pickFiles')
  },
  fs: {
    scanFolder: (p: string) => ipcRenderer.invoke('fs:scanFolder', p)
  },
  shell: {
    openDataDir: () => ipcRenderer.invoke('shell:openDataDir')
  }
})
