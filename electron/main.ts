import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'

// ES模块中的__dirname替代方案
const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

// 保持对窗口对象的全局引用，如果不这样做，当JavaScript对象被垃圾回收时，窗口将自动关闭
let mainWindow: BrowserWindow | null = null

// 开发环境检测
const isDev = process.env.NODE_ENV === 'development'

// 加载配置文件
function loadConfig() {
  try {
    const configPath = isDev
      ? join(__dirname, '../config/development.json')
      : join(__dirname, '../config/production.json')

    const baseConfigPath = join(__dirname, '../config/app.json')

    let config: any = {}

    // 加载基础配置
    if (existsSync(baseConfigPath)) {
      config = JSON.parse(readFileSync(baseConfigPath, 'utf-8'))
    }

    // 加载环境特定配置
    if (existsSync(configPath)) {
      const envConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
      config = { ...config, ...envConfig }
    }

    return config
  } catch (error) {
    console.warn('Failed to load config:', error)
    return {
      app: { name: '艾宾浩斯学习计划工具' },
      server: { port: 3000 }
    }
  }
}

const config = loadConfig()

console.log('Starting Electron app...')
console.log('Config:', config)

function createWindow(): void {
  console.log('Creating window...')
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'default', // 使用默认标题栏以避免重叠问题
    icon: join(__dirname, '../assets/icon.png'), // 应用图标
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      webSecurity: !isDev
    }
  })

  // 加载应用
  if (isDev) {
    // 开发环境加载本地服务器，默认使用3001端口
    const port = config.server?.port || 3001
    mainWindow.loadURL(`http://localhost:${port}`)

    // 开发工具
    if (process.env.DEBUG === 'true') {
      mainWindow.webContents.openDevTools()
    }
  } else {
    // 生产环境加载打包后的文件
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // 当窗口准备好显示时显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()

    if (isDev && process.env.DEBUG === 'true') {
      mainWindow?.webContents.openDevTools()
    }
  })

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    // 取消引用window对象，如果你的应用支持多窗口的话，通常会把多个window对象存放在一个数组里面，与此同时，你应该删除相应的元素
    mainWindow = null
  })

  // 处理窗口创建
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 拦截导航事件
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // 只允许导航到本地开发服务器或文件
    if (isDev) {
      const port = config.server?.port || 3001
      const allowedUrl = `http://localhost:${port}`
      if (!url.startsWith(allowedUrl) && !url.startsWith('file://')) {
        event.preventDefault()
        shell.openExternal(url)
      }
    } else {
      if (!url.startsWith('file://')) {
        event.preventDefault()
        shell.openExternal(url)
      }
    }
  })
}

// 这段程序将会在Electron结束初始化和创建浏览器窗口的时候调用
// 部分API在ready事件触发后才能使用
app.whenReady().then(() => {
  // 设置应用ID (macOS)
  app.setAppUserModelId('com.ebbinghaus.app')

  // 设置应用名称
  if (process.platform === 'darwin') {
    app.setName(config.app?.name || '艾宾浩斯学习计划工具')
  }

  createWindow()

  // 在macOS上，当点击dock图标并且没有其他窗口打开时，通常在应用程序中重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // 创建菜单
  createMenu()
})

// 当全部窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，除非用户用Cmd + Q确定地退出，否则绝大部分应用及其菜单栏会保持激活
  if (process.platform !== 'darwin') app.quit()
})

// 创建应用菜单
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: config.app?.name || '艾宾浩斯学习计划工具',
      submenu: [
        {
          label: '关于 ' + (config.app?.name || '艾宾浩斯学习计划工具'),
          role: 'about'
        },
        { type: 'separator' },
        {
          label: '服务',
          role: 'services'
        },
        { type: 'separator' },
        {
          label: '隐藏 ' + (config.app?.name || '艾宾浩斯学习计划工具'),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: '隐藏其他',
          accelerator: 'Command+Shift+H',
          role: 'hideOthers'
        },
        {
          label: '显示全部',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '重新加载',
          accelerator: process.platform === 'darwin' ? 'Cmd+R' : 'Ctrl+R',
          click: () => {
            mainWindow?.webContents.reload()
          }
        },
        {
          label: '强制重新加载',
          accelerator: process.platform === 'darwin' ? 'Cmd+Shift+R' : 'Ctrl+Shift+R',
          click: () => {
            mainWindow?.webContents.reloadIgnoringCache()
          }
        },
        {
          label: '开发者工具',
          accelerator: process.platform === 'darwin' ? 'Option+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow?.webContents.toggleDevTools()
          }
        },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' },
        { type: 'separator' },
        { label: '前置所有窗口', role: 'front' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于',
              message: config.app?.name || '艾宾浩斯学习计划工具',
              detail: `${config.app?.description || '基于艾宾浩斯遗忘曲线的科学学习方案'}\n版本: ${config.app?.version || '1.0.0'}\n\n基于 Vue 3 + Electron 构建`
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// IPC 处理程序
ipcMain.handle('app-version', () => {
  return config.app?.version || '1.0.0'
})

ipcMain.handle('app-name', () => {
  return config.app?.name || '艾宾浩斯学习计划工具'
})

ipcMain.handle('is-dev', () => {
  return isDev
})

// 处理证书错误（仅在开发环境）
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev && url.includes('localhost')) {
    // 开发环境忽略本地证书错误
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

// 防止多个实例
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时，将会聚焦到mainWindow这个窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}