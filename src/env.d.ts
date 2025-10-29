/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Electron API 类型定义
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}