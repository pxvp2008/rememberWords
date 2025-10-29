import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'

// 加载配置文件
function loadConfig() {
  const env = process.env.NODE_ENV || 'development'

  // 加载基础配置
  let config: any = {}
  try {
    const baseConfigPath = resolve(__dirname, 'config/app.json')
    if (existsSync(baseConfigPath)) {
      config = JSON.parse(readFileSync(baseConfigPath, 'utf-8'))
    }
  } catch (error) {
    console.warn('Failed to load base config:', error)
  }

  // 加载环境特定配置
  try {
    const envConfigPath = resolve(__dirname, `config/${env}.json`)
    if (existsSync(envConfigPath)) {
      const envConfig = JSON.parse(readFileSync(envConfigPath, 'utf-8'))
      config = { ...config, ...envConfig }
    }
  } catch (error) {
    console.warn(`Failed to load ${env} config:`, error)
  }

  return config
}

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  const config = loadConfig()

  // 对于Electron构建，使用相对路径
  const base = mode === 'production' ? './' : '/'

  return {
    base,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    // 服务器配置
    server: {
      port: parseInt(env.PORT || config.server?.port?.toString() || '3000'),
      host: env.HOST || config.server?.host || 'localhost',
      open: env.OPEN !== 'false' && config.server?.open !== false,
      cors: env.CORS !== 'false' && config.server?.cors !== false,
      https: env.HTTPS === 'true' || config.server?.https === true
    },

    // 构建配置
    build: {
      outDir: env.OUT_DIR || config.build?.outDir || 'dist',
      assetsDir: config.build?.assetsDir || 'assets',
      sourcemap: env.SOURCEMAP === 'true' || config.build?.sourcemap === true,
      minify: (env.MINIFY as any) || config.build?.minify || 'terser',

      // 分块配置
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'element-plus'],
            charts: ['echarts'],
            utils: ['xlsx']
          }
        }
      }
    },

    // 环境变量定义
    define: {
      __APP_VERSION__: JSON.stringify(config.app?.version || '1.0.0'),
      __APP_NAME__: JSON.stringify(config.app?.name || '艾宾浩斯学习计划工具'),
      __CONFIG__: JSON.stringify(config)
    },

    // CSS 配置
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `$primary-color: #667eea; $secondary-color: #764ba2;`
        }
      }
    },

    // 预览服务器配置
    preview: {
      port: parseInt(env.PREVIEW_PORT || '4173'),
      host: env.PREVIEW_HOST || 'localhost',
      open: env.PREVIEW_OPEN !== 'false'
    }
  }
})