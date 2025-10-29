/**
 * 全局错误处理系统
 * 提供统一的错误捕获、分类和报告机制
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION',     // 数据验证错误
  NETWORK = 'NETWORK',           // 网络请求错误
  STORAGE = 'STORAGE',           // 存储相关错误
  FILE = 'FILE',                 // 文件操作错误
  ALGORITHM = 'ALGORITHM',       // 算法执行错误
  COMPONENT = 'COMPONENT',       // 组件渲染错误
  UNKNOWN = 'UNKNOWN'            // 未知错误
}

export interface ErrorInfo {
  type: ErrorType
  message: string
  details?: any
  timestamp: Date
  userAgent?: string
  url?: string
  userId?: string
}

class ErrorHandler {
  private errors: ErrorInfo[] = []
  private maxErrors = 100 // 最多保存100个错误记录

  constructor() {
    // 全局错误监听
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this))
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))
    }
  }

  /**
   * 处理全局错误
   */
  private handleGlobalError(event: ErrorEvent) {
    const errorInfo: ErrorInfo = {
      type: ErrorType.COMPONENT,
      message: event.message,
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.handleError(errorInfo)
  }

  /**
   * 处理未捕获的Promise拒绝
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const errorInfo: ErrorInfo = {
      type: ErrorType.UNKNOWN,
      message: 'Unhandled Promise Rejection',
      details: {
        reason: event.reason,
        stack: event.reason?.stack
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.handleError(errorInfo)
  }

  /**
   * 主要错误处理方法
   */
  public handleError(errorInfo: Partial<ErrorInfo>, error?: Error): void {
    // 构建完整的错误信息
    const fullErrorInfo: ErrorInfo = {
      type: errorInfo.type || ErrorType.UNKNOWN,
      message: errorInfo.message || (error?.message || 'Unknown error'),
      details: errorInfo.details || {
        stack: error?.stack
      },
      timestamp: errorInfo.timestamp || new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    // 添加到错误列表
    this.addError(fullErrorInfo)

    // 根据错误类型处理
    this.processErrorByType(fullErrorInfo)

    // 记录日志
    console.error(`[${fullErrorInfo.type}] ${fullErrorInfo.message}`, fullErrorInfo.details)
  }

  /**
   * 根据错误类型处理
   */
  private processErrorByType(errorInfo: ErrorInfo): void {
    switch (errorInfo.type) {
      case ErrorType.STORAGE:
        this.handleStorageError(errorInfo)
        break
      case ErrorType.FILE:
        this.handleFileError(errorInfo)
        break
      case ErrorType.VALIDATION:
        this.handleValidationError(errorInfo)
        break
      case ErrorType.ALGORITHM:
        this.handleAlgorithmError(errorInfo)
        break
      case ErrorType.NETWORK:
        this.handleNetworkError(errorInfo)
        break
      default:
        this.handleUnknownError(errorInfo)
    }
  }

  /**
   * 处理存储错误
   */
  private handleStorageError(errorInfo: ErrorInfo): void {
    // 检查是否是存储空间不足
    if (errorInfo.message?.includes('storage') || errorInfo.message?.includes('quota')) {
      // 可以提示用户清理存储空间
      this.showUserMessage('存储空间不足，请清理浏览器数据', 'warning')
    }
  }

  /**
   * 处理文件操作错误
   */
  private handleFileError(errorInfo: ErrorInfo): void {
    // 文件格式不支持、文件过大等
    if (errorInfo.message?.includes('format') || errorInfo.message?.includes('type')) {
      this.showUserMessage('文件格式不支持，请选择Excel文件', 'error')
    } else if (errorInfo.message?.includes('size') || errorInfo.message?.includes('large')) {
      this.showUserMessage('文件过大，请选择小于10MB的文件', 'warning')
    }
  }

  /**
   * 处理验证错误
   */
  private handleValidationError(errorInfo: ErrorInfo): void {
    // 数据验证失败，通常由具体组件处理
    this.showUserMessage('数据格式不正确，请检查输入', 'error')
  }

  /**
   * 处理算法错误
   */
  private handleAlgorithmError(errorInfo: ErrorInfo): void {
    // 艾宾浩斯算法执行错误
    this.showUserMessage('学习计划生成失败，请检查参数设置', 'error')
  }

  /**
   * 处理网络错误
   */
  private handleNetworkError(errorInfo: ErrorInfo): void {
    this.showUserMessage('网络连接失败，请检查网络设置', 'error')
  }

  /**
   * 处理未知错误
   */
  private handleUnknownError(errorInfo: ErrorInfo): void {
    this.showUserMessage('操作失败，请重试', 'error')
  }

  /**
   * 显示用户友好的错误消息
   */
  private showUserMessage(message: string, type: 'error' | 'warning' | 'info'): void {
    // 这里可以集成具体的UI库，如Element Plus的Message
    if (typeof window !== 'undefined' && (window as any).ElMessage) {
      const ElMessage = (window as any).ElMessage
      switch (type) {
        case 'error':
          ElMessage.error(message)
          break
        case 'warning':
          ElMessage.warning(message)
          break
        case 'info':
          ElMessage.info(message)
          break
      }
    } else {
      // 降级到原生浏览器提示
      console.warn(`用户消息 (${type}): ${message}`)
    }
  }

  /**
   * 添加错误到记录
   */
  private addError(errorInfo: ErrorInfo): void {
    this.errors.unshift(errorInfo)

    // 保持错误记录数量在限制内
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }
  }

  /**
   * 获取所有错误记录
   */
  public getErrors(): ErrorInfo[] {
    return [...this.errors]
  }

  /**
   * 清除错误记录
   */
  public clearErrors(): void {
    this.errors = []
  }

  /**
   * 获取错误统计
   */
  public getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {
      [ErrorType.VALIDATION]: 0,
      [ErrorType.NETWORK]: 0,
      [ErrorType.STORAGE]: 0,
      [ErrorType.FILE]: 0,
      [ErrorType.ALGORITHM]: 0,
      [ErrorType.COMPONENT]: 0,
      [ErrorType.UNKNOWN]: 0
    }

    this.errors.forEach(error => {
      stats[error.type]++
    })

    return stats
  }

  /**
   * 导出错误报告
   */
  public exportErrorReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: this.errors.length,
      errorStats: this.getErrorStats(),
      errors: this.errors
    }

    return JSON.stringify(report, null, 2)
  }
}

// 创建全局单例
export const errorHandler = new ErrorHandler()

// 便捷的错误处理函数
export const handleError = (type: ErrorType, message: string, details?: any, error?: Error) => {
  errorHandler.handleError({ type, message, details, timestamp: new Date() }, error)
}

export const handleValidationError = (message: string, details?: any) => {
  handleError(ErrorType.VALIDATION, message, details)
}

export const handleStorageError = (message: string, details?: any) => {
  handleError(ErrorType.STORAGE, message, details)
}

export const handleFileError = (message: string, details?: any) => {
  handleError(ErrorType.FILE, message, details)
}

export const handleAlgorithmError = (message: string, details?: any) => {
  handleError(ErrorType.ALGORITHM, message, details)
}