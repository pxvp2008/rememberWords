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
  skipWeekends: boolean // 是否跳过周末（周六和周日）
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

  /**
   * 判断指定日期是否为周末（周六或周日）
   */
  static isWeekend(dateString: string): boolean {
    const date = DateUtils.parseDate(dateString)
    const dayOfWeek = date.getDay() // 0 = 周日, 6 = 周六
    return dayOfWeek === 0 || dayOfWeek === 6
  }

  /**
   * 计算跳过周末的情况下，从起始日期开始的工作日
   */
  static getWorkdays(startDate: string, dayCount: number): string[] {
    const workdays: string[] = []
    let currentDate = DateUtils.parseDate(startDate)
    let addedDays = 0

    while (addedDays < dayCount) {
      const dateString = DateUtils.formatDate(currentDate)
      if (!DateUtils.isWeekend(dateString)) {
        workdays.push(dateString)
        addedDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return workdays
  }

  /**
   * 获取星期名称
   */
  static getDayName(dateString: string): string {
    const date = DateUtils.parseDate(dateString)
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()]
  }

  /**
   * 计算两个日期之间的天数差
   */
  static daysBetween(startDate: string, endDate: string): number {
    const start = DateUtils.parseDate(startDate)
    const end = DateUtils.parseDate(endDate)
    const timeDiff = end.getTime() - start.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  /**
   * 添加指定的工作日数量（跳过周末）
   */
  static addWorkdays(startDate: string, workdays: number): string {
    let currentDate = DateUtils.parseDate(startDate)
    let addedWorkdays = 0

    while (addedWorkdays < workdays) {
      currentDate.setDate(currentDate.getDate() + 1)
      const dateString = DateUtils.formatDate(currentDate)
      if (!DateUtils.isWeekend(dateString)) {
        addedWorkdays++
      }
    }

    return DateUtils.formatDate(currentDate)
  }

  /**
   * 获取下一个工作日
   */
  static getNextWorkday(dateString: string): string {
    let currentDate = DateUtils.parseDate(dateString)

    do {
      currentDate.setDate(currentDate.getDate() + 1)
    } while (DateUtils.isWeekend(DateUtils.formatDate(currentDate)))

    return DateUtils.formatDate(currentDate)
  }
}