import { ref, computed, readonly } from 'vue'

export interface ClientConfig {
  app: {
    name: string
    shortName: string
    version: string
    description: string
  }
  defaults: {
    learning: {
      period: number
      newWordsPerDay: number
      maxReviewPerDay: number
      ebbinghausIntervals: number[]
    }
    ui: {
      language: string
      theme: string
      pageSize: number
    }
    import: {
      maxFileSize: string
      maxWordCount: number
      supportedFormats: string[]
    }
  }
  storage: {
    prefix: string
    localStorage: boolean
    sessionStorage: boolean
    encrypt: boolean
  }
  features: {
    debug: boolean
    analytics: boolean
    pwa: boolean
    darkMode: boolean
  }
}

// 默认客户端配置（与服务器配置同步）
const defaultClientConfig: ClientConfig = {
  app: {
    name: '艾宾浩斯学习计划工具',
    shortName: '记忆单词工具',
    version: '1.0.0',
    description: '基于艾宾浩斯遗忘曲线的科学学习方案'
  },
  defaults: {
    learning: {
      period: 30,
      newWordsPerDay: 10,
      maxReviewPerDay: 30,
      ebbinghausIntervals: [1, 2, 4, 7, 15]
    },
    ui: {
      language: 'zh-CN',
      theme: 'default',
      pageSize: 20
    },
    import: {
      maxFileSize: '10MB',
      maxWordCount: 1000,
      supportedFormats: ['.xlsx', '.xls', '.csv']
    }
  },
  storage: {
    prefix: 'ebbinghaus_',
    localStorage: true,
    sessionStorage: false,
    encrypt: false
  },
  features: {
    debug: false,
    analytics: false,
    pwa: false,
    darkMode: false
  }
}

export function useConfig() {
  const config = ref<ClientConfig>(defaultClientConfig)

  // 从localStorage加载用户自定义配置
  const loadUserConfig = () => {
    try {
      const userConfigStr = localStorage.getItem('user_config')
      if (userConfigStr) {
        const userConfig = JSON.parse(userConfigStr)
        config.value = mergeConfig(config.value, userConfig)
      }
    } catch (error) {
      console.warn('Failed to load user config:', error)
    }
  }

  // 保存用户配置到localStorage
  const saveUserConfig = (userConfig: Partial<ClientConfig>) => {
    try {
      localStorage.setItem('user_config', JSON.stringify(userConfig))
      config.value = mergeConfig(config.value, userConfig)
    } catch (error) {
      console.warn('Failed to save user config:', error)
    }
  }

  // 合并配置
  const mergeConfig = (base: ClientConfig, override: Partial<ClientConfig>): ClientConfig => {
    return {
      app: { ...base.app, ...override.app },
      defaults: {
        learning: { ...base.defaults.learning, ...override.defaults?.learning },
        ui: { ...base.defaults.ui, ...override.defaults?.ui },
        import: { ...base.defaults.import, ...override.defaults?.import }
      },
      storage: { ...base.storage, ...override.storage },
      features: { ...base.features, ...override.features }
    } as ClientConfig
  }

  // 重置为默认配置
  const resetConfig = () => {
    localStorage.removeItem('user_config')
    config.value = { ...defaultClientConfig }
  }

  // 获取特定配置项
  const getLearningDefaults = computed(() => config.value.defaults.learning)
  const getUiDefaults = computed(() => config.value.defaults.ui)
  const getImportDefaults = computed(() => config.value.defaults.import)
  const getStorageConfig = computed(() => config.value.storage)
  const getFeatures = computed(() => config.value.features)

  // 检查功能是否启用
  const isFeatureEnabled = (feature: keyof ClientConfig['features']) => {
    return config.value.features[feature]
  }

  // 更新学习默认值
  const updateLearningDefaults = (learning: Partial<ClientConfig['defaults']['learning']>) => {
    saveUserConfig({
      defaults: {
        ...config.value.defaults,
        learning: { ...config.value.defaults.learning, ...learning }
      }
    })
  }

  // 更新UI默认值
  const updateUiDefaults = (ui: Partial<ClientConfig['defaults']['ui']>) => {
    saveUserConfig({
      defaults: {
        ...config.value.defaults,
        ui: { ...config.value.defaults.ui, ...ui }
      }
    })
  }

  // 切换功能开关
  const toggleFeature = (feature: keyof ClientConfig['features']) => {
    saveUserConfig({
      features: {
        ...config.value.features,
        [feature]: !config.value.features[feature]
      }
    })
  }

  // 初始化配置
  loadUserConfig()

  return {
    config: readonly(config),
    getLearningDefaults,
    getUiDefaults,
    getImportDefaults,
    getStorageConfig,
    getFeatures,
    isFeatureEnabled,
    updateLearningDefaults,
    updateUiDefaults,
    toggleFeature,
    saveUserConfig,
    resetConfig,
    loadUserConfig
  }
}

// 导出便捷的组合式函数
export function useLearningConfig() {
  const { getLearningDefaults, updateLearningDefaults } = useConfig()

  return {
    defaults: getLearningDefaults,
    updateDefaults: updateLearningDefaults,
    period: computed(() => getLearningDefaults.value.period),
    newWordsPerDay: computed(() => getLearningDefaults.value.newWordsPerDay),
    maxReviewPerDay: computed(() => getLearningDefaults.value.maxReviewPerDay),
    ebbinghausIntervals: computed(() => getLearningDefaults.value.ebbinghausIntervals)
  }
}

export function useImportConfig() {
  const { getImportDefaults } = useConfig()

  return {
    config: getImportDefaults,
    maxFileSize: computed(() => getImportDefaults.value.maxFileSize),
    maxWordCount: computed(() => getImportDefaults.value.maxWordCount),
    supportedFormats: computed(() => getImportDefaults.value.supportedFormats)
  }
}

export function useFeatures() {
  const { getFeatures, isFeatureEnabled, toggleFeature } = useConfig()

  return {
    features: getFeatures,
    isFeatureEnabled,
    toggleFeature,
    isDebug: computed(() => isFeatureEnabled('debug')),
    isAnalytics: computed(() => isFeatureEnabled('analytics')),
    isPWA: computed(() => isFeatureEnabled('pwa')),
    isDarkMode: computed(() => isFeatureEnabled('darkMode'))
  }
}