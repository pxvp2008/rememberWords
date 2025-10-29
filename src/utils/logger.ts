/**
 * 日志工具类
 * 根据环境控制日志输出
 */
class Logger {
  private isDev: boolean

  constructor() {
    // 检查是否为开发环境
    this.isDev = import.meta.env.DEV ||
                import.meta.env.MODE === 'development' ||
                window.location.hostname === 'localhost'
  }

  /**
   * 开发环境日志
   */
  log(...args: any[]): void {
    if (this.isDev) {
      console.log('[DEV]', ...args)
    }
  }

  /**
   * 错误日志（所有环境都输出）
   */
  error(...args: any[]): void {
    console.error('[ERROR]', ...args)
  }

  /**
   * 警告日志（所有环境都输出）
   */
  warn(...args: any[]): void {
    console.warn('[WARN]', ...args)
  }

  /**
   * 信息日志（仅开发环境）
   */
  info(...args: any[]): void {
    if (this.isDev) {
      console.info('[INFO]', ...args)
    }
  }

  /**
   * 调试日志（仅开发环境）
   */
  debug(...args: any[]): void {
    if (this.isDev) {
      console.debug('[DEBUG]', ...args)
    }
  }

  /**
   * 表格日志（仅开发环境）
   */
  table(data: any): void {
    if (this.isDev && console.table) {
      console.table(data)
    }
  }

  /**
   * 分组开始（仅开发环境）
   */
  group(label?: string): void {
    if (this.isDev && console.group) {
      console.group(label)
    }
  }

  /**
   * 分组结束（仅开发环境）
   */
  groupEnd(): void {
    if (this.isDev && console.groupEnd) {
      console.groupEnd()
    }
  }

  /**
   * 时间测量开始（仅开发环境）
   */
  time(label: string): void {
    if (this.isDev && console.time) {
      console.time(label)
    }
  }

  /**
   * 时间测量结束（仅开发环境）
   */
  timeEnd(label: string): void {
    if (this.isDev && console.timeEnd) {
      console.timeEnd(label)
    }
  }
}

// 导出单例实例
export const logger = new Logger()

// 导出类型
export type LoggerInstance = Logger