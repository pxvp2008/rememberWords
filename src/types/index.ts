export interface Word {
  id: string
  word: string
  meaning: string
}

export interface StudySettings {
  period: number // 学习周期（天）
  dailyNew: number // 每日新学单词数
  maxReview: number // 每日最大复习数
  startDate: string // 起始日期 (YYYY-MM-DD格式)
}

export interface DailyTask {
  date: string
  newWords: Word[]
  reviewWords: Word[]
}

export interface StudyPlan {
  settings: StudySettings
  tasks: DailyTask[]
  originalWords: Word[]
}

export interface ExcelImportResult {
  success: boolean
  words?: Word[]
  error?: string
}

export const EBBINGHAUS_INTERVALS = [1, 2, 4, 7, 15] // 艾宾浩斯复习间隔（天）

// 日期工具函数
export class DateUtils {
  /**
   * 格式化日期为 YYYY-MM-DD 字符串
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * 解析 YYYY-MM-DD 字符串为 Date 对象
   */
  static parseDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00.000Z')
  }

  /**
   * 获取今天的日期字符串 (YYYY-MM-DD)
   */
  static today(): string {
    return DateUtils.formatDate(new Date())
  }

  /**
   * 添加指定天数到日期字符串
   */
  static addDays(dateString: string, days: number): string {
    const date = DateUtils.parseDate(dateString)
    date.setDate(date.getDate() + days)
    return DateUtils.formatDate(date)
  }

  /**
   * 验证日期字符串格式是否为 YYYY-MM-DD
   */
  static isValidDateString(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false

    const date = DateUtils.parseDate(dateString)
    return !isNaN(date.getTime())
  }
}