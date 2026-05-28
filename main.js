const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs   = require('fs')
const path = require('path')

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width:     1280,
    height:    800,
    minWidth:  900,
    minHeight: 600,
    title: 'BCH Template · FNNDSC New Born',
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  win.loadFile('index.html')
  win.setMenu(null)
})

ipcMain.handle('save-file', async (_event, content, filename) => {
  const { filePath, canceled } = await dialog.showSaveDialog({ defaultPath: filename })
  if (canceled || !filePath) return { success: false }
  fs.writeFileSync(filePath, content, 'utf8')
  return { success: true }
})

ipcMain.handle('save-files', async (_event, files) => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title:       'Choose export folder',
    buttonLabel: 'Save here',
    properties:  ['openDirectory', 'createDirectory'],
  })
  if (canceled || !filePaths.length) return { success: false }
  const dir = filePaths[0]
  for (const { content, filename } of files) {
    fs.writeFileSync(path.join(dir, filename), content, 'utf8')
  }
  return { success: true }
})

ipcMain.handle('print-to-pdf', async (event, filename) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: filename,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  })
  if (canceled || !filePath) return { success: false }
  const win  = BrowserWindow.fromWebContents(event.sender)
  const data = await win.webContents.printToPDF({ printBackground: true, pageSize: 'Letter' })
  fs.writeFileSync(filePath, data)
  return { success: true }
})

app.on('window-all-closed', () => app.quit())
