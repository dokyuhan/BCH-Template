const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile:   (content, filename) => ipcRenderer.invoke('save-file', content, filename),
  saveFiles:  (files)             => ipcRenderer.invoke('save-files', files),
  printToPDF: (filename)          => ipcRenderer.invoke('print-to-pdf', filename),
})
