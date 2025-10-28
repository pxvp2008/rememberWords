import { ref, watch } from 'vue'
import type { Word, StudySettings, StudyPlan } from '@/types'

const STORAGE_KEYS = {
  WORDS: 'rememberwords_words',
  SETTINGS: 'rememberwords_settings',
  PLAN: 'rememberwords_plan'
}

const DEFAULT_SETTINGS: StudySettings = {
  period: 30,
  dailyNew: 5,
  maxReview: 10,
  startDate: new Date().toISOString().split('T')[0]
}

export function useStorage() {
  // 从localStorage读取数据
  const loadWords = (): Word[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORDS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取单词数据失败:', error)
      return []
    }
  }

  const loadSettings = (): StudySettings => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (data) {
        const settings = JSON.parse(data)
        // 保持startDate为字符串格式，确保与组件一致
        if (settings.startDate && typeof settings.startDate !== 'string') {
          settings.startDate = new Date(settings.startDate).toISOString().split('T')[0]
        }
        return { ...DEFAULT_SETTINGS, ...settings }
      }
    } catch (error) {
      console.error('读取设置数据失败:', error)
    }
    // 确保总是返回当前日期作为默认起始日期
    return {
      ...DEFAULT_SETTINGS,
      startDate: new Date().toISOString().split('T')[0]
    }
  }

  const loadPlan = (): StudyPlan | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAN)
      if (data) {
        const plan = JSON.parse(data)
        // 确保日期是字符串格式，与组件保持一致
        if (plan.settings.startDate && typeof plan.settings.startDate !== 'string') {
          plan.settings.startDate = new Date(plan.settings.startDate).toISOString().split('T')[0]
        }
        return plan
      }
    } catch (error) {
      console.error('读取计划数据失败:', error)
    }
    return null
  }

  // 保存数据到localStorage
  const saveWords = (words: Word[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words))
    } catch (error) {
      console.error('保存单词数据失败:', error)
      throw new Error('存储空间不足，请清理浏览器数据')
    }
  }

  const saveSettings = (settings: StudySettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('保存设置数据失败:', error)
      throw new Error('存储空间不足，请清理浏览器数据')
    }
  }

  const savePlan = (plan: StudyPlan) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan))
    } catch (error) {
      console.error('保存计划数据失败:', error)
      throw new Error('存储空间不足，请清理浏览器数据')
    }
  }

  // 清除数据
  const clearWords = () => {
    localStorage.removeItem(STORAGE_KEYS.WORDS)
  }

  const clearPlan = () => {
    localStorage.removeItem(STORAGE_KEYS.PLAN)
  }

  const clearAll = () => {
    // 清除所有 localStorage 数据
    localStorage.removeItem(STORAGE_KEYS.WORDS)
    localStorage.removeItem(STORAGE_KEYS.SETTINGS)
    localStorage.removeItem(STORAGE_KEYS.PLAN)

    // 使用数组解构确保响应式更新
    const currentDate = new Date().toISOString().split('T')[0]
    words.value.splice(0, words.value.length) // 清空数组但保持响应性
    settings.value = { ...DEFAULT_SETTINGS, startDate: currentDate }
    plan.value = null
  }

  // 响应式数据管理
  const words = ref<Word[]>(loadWords())
  const settings = ref<StudySettings>(loadSettings())
  const plan = ref<StudyPlan | null>(loadPlan())

  // 自动保存
  watch(words, (newWords) => {
    saveWords(newWords)
  }, { deep: true })

  watch(settings, (newSettings) => {
    saveSettings(newSettings)
  }, { deep: true })

  watch(plan, (newPlan) => {
    if (newPlan) {
      savePlan(newPlan)
    } else {
      clearPlan()
    }
  }, { deep: true })

  // 检查存储可用性
  const checkStorageAvailability = (): boolean => {
    try {
      const testKey = 'test'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      console.error('localStorage不可用:', error)
      return false
    }
  }

  // 获取存储使用情况
  const getStorageUsage = () => {
    try {
      let totalSize = 0
      const data: Record<string, any> = {}

      Object.values(STORAGE_KEYS).forEach(key => {
        const value = localStorage.getItem(key)
        if (value) {
          const size = new Blob([value]).size
          totalSize += size
          data[key] = {
            size,
            sizeText: formatBytes(size),
            itemCount: JSON.parse(value).length || 1
          }
        }
      })

      return {
        totalSize,
        totalSizeText: formatBytes(totalSize),
        details: data,
        available: checkStorageAvailability()
      }
    } catch (error) {
      console.error('获取存储使用情况失败:', error)
      return {
        totalSize: 0,
        totalSizeText: '0 B',
        details: {},
        available: false
      }
    }
  }

  // 格式化字节大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    // 响应式数据
    words,
    settings,
    plan,

    // 操作方法
    loadWords,
    loadSettings,
    loadPlan,
    saveWords,
    saveSettings,
    savePlan,
    clearWords,
    clearPlan,
    clearAll,

    // 工具方法
    checkStorageAvailability,
    getStorageUsage,
    formatBytes
  }
}