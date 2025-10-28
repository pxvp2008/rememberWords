export interface Word {
  id: string
  word: string
  meaning: string
}

export interface StudySettings {
  period: number // 学习周期（天）
  dailyNew: number // 每日新学单词数
  maxReview: number // 每日最大复习数
  startDate: Date // 起始日期
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