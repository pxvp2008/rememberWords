const { contextBridge, ipcRenderer } = require('electron')

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppName: () => ipcRenderer.invoke('app-name'),
  isDev: () => ipcRenderer.invoke('is-dev'),

  // 平台信息
  platform: process.platform,

  // 文件操作 (如果需要的话)
  showMessageBox: (options: Electron.MessageBoxOptions) =>
    ipcRenderer.invoke('show-message-box', options),

  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('show-save-dialog', options),

  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('show-open-dialog', options)
})

export {}