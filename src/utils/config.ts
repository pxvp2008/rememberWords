import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export interface AppConfig {
  app: {
    name: string
    shortName: string
    version: string
    description: string
  }
  server: {
    port: number
    host: string
    https: boolean
    cors: boolean
    open: boolean
  }
  build: {
    outDir: string
    assetsDir: string
    sourcemap: boolean
    minify: 'terser' | 'esbuild' | boolean
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

class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig
  private environment: 'development' | 'production' = 'development'

  private constructor() {
    this.loadConfig()
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  private loadConfig(): void {
    this.environment = (process.env.NODE_ENV as 'development' | 'production') || 'development'

    // 加载基础配置
    const baseConfigPath = resolve(__dirname, '../../config/app.json')
    let config: AppConfig

    try {
      const baseConfig = JSON.parse(readFileSync(baseConfigPath, 'utf-8'))
      config = baseConfig

      // 加载环境特定配置
      const envConfigPath = resolve(__dirname, `../../config/${this.environment}.json`)
      if (existsSync(envConfigPath)) {
        const envConfig = JSON.parse(readFileSync(envConfigPath, 'utf-8'))
        config = this.mergeConfig(config, envConfig)
      }

      // 加载环境变量覆盖
      config = this.loadEnvironmentOverrides(config)

    } catch (error) {
      console.warn('Failed to load config files, using defaults:', error)
      config = this.getDefaultConfig()
    }

    this.config = config
  }

  private mergeConfig(base: AppConfig, override: Partial<AppConfig>): AppConfig {
    return {
      app: { ...base.app, ...override.app },
      server: { ...base.server, ...override.server },
      build: { ...base.build, ...override.build },
      defaults: {
        learning: { ...base.defaults.learning, ...override.defaults?.learning },
        ui: { ...base.defaults.ui, ...override.defaults?.ui },
        import: { ...base.defaults.import, ...override.defaults?.import }
      },
      storage: { ...base.storage, ...override.storage },
      features: { ...base.features, ...override.features }
    } as AppConfig
  }

  private loadEnvironmentOverrides(config: AppConfig): AppConfig {
    const envOverrides: Partial<AppConfig> = {}

    // 服务器配置
    if (process.env.PORT) {
      envOverrides.server = { ...config.server, port: parseInt(process.env.PORT) }
    }
    if (process.env.HOST) {
      envOverrides.server = { ...envOverrides.server || config.server, host: process.env.HOST }
    }
    if (process.env.HTTPS) {
      envOverrides.server = { ...envOverrides.server || config.server, https: process.env.HTTPS === 'true' }
    }

    // 构建配置
    if (process.env.OUT_DIR) {
      envOverrides.build = { ...config.build, outDir: process.env.OUT_DIR }
    }

    // 功能开关
    if (process.env.DEBUG) {
      envOverrides.features = { ...config.features, debug: process.env.DEBUG === 'true' }
    }
    if (process.env.ANALYTICS) {
      envOverrides.features = { ...envOverrides.features || config.features, analytics: process.env.ANALYTICS === 'true' }
    }

    return this.mergeConfig(config, envOverrides)
  }

  private getDefaultConfig(): AppConfig {
    return {
      app: {
        name: '艾宾浩斯学习计划工具',
        shortName: '记忆单词工具',
        version: '1.0.0',
        description: '基于艾宾浩斯遗忘曲线的科学学习方案'
      },
      server: {
        port: 3000,
        host: 'localhost',
        https: false,
        cors: true,
        open: true
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser'
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
  }

  public getConfig(): AppConfig {
    return this.config
  }

  public getServerConfig() {
    return this.config.server
  }

  public getBuildConfig() {
    return this.config.build
  }

  public getDefaults() {
    return this.config.defaults
  }

  public getFeatures() {
    return this.config.features
  }

  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature]
  }

  public getEnvironment(): 'development' | 'production' {
    return this.environment
  }

  public reloadConfig(): void {
    this.loadConfig()
  }
}

// 导出单例实例
export const config = ConfigManager.getInstance()

// 导出便捷方法
export const getServerPort = () => config.getServerConfig().port
export const getServerHost = () => config.getServerConfig().host
export const isDevelopment = () => config.getEnvironment() === 'development'
export const isProduction = () => config.getEnvironment() === 'production'
export const isDebugEnabled = () => config.isFeatureEnabled('debug')
export const isAnalyticsEnabled = () => config.isFeatureEnabled('analytics')