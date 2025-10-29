const { contextBridge, ipcRenderer } = require('electron')

// 定义API接口
interface ElectronAPI {
  // 应用信息
  getAppVersion: () => Promise<string>
  getAppName: () => Promise<string>
  isDev: () => Promise<boolean>

  // 平台信息
  platform: string

  // 文件操作
  showMessageBox: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
}

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppName: () => ipcRenderer.invoke('app-name'),
  isDev: () => ipcRenderer.invoke('is-dev'),

  // 平台信息
  platform: process.platform,

  // 文件操作
  showMessageBox: (options: Electron.MessageBoxOptions) =>
    ipcRenderer.invoke('show-message-box', options),

  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('show-save-dialog', options),

  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('show-open-dialog', options)
} as ElectronAPI)

export {}