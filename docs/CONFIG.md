# ⚙️ 配置系统使用指南

本项目支持通过配置文件和环境变量来灵活配置系统参数。

## 📁 配置文件结构

```
config/
├── app.json          # 基础配置文件
├── development.json  # 开发环境配置
└── production.json   # 生产环境配置
```

## 🔧 配置优先级

配置加载优先级从高到低：

1. **环境变量** (最高优先级)
2. **环境特定配置文件** (`development.json` / `production.json`)
3. **基础配置文件** (`app.json`)
4. **默认值** (最低优先级)

## 📋 配置项说明

### 应用基础配置 (`app`)

```json
{
  "app": {
    "name": "艾宾浩斯学习计划工具",
    "shortName": "记忆单词工具",
    "version": "1.0.0",
    "description": "基于艾宾浩斯遗忘曲线的科学学习方案"
  }
}
```

### 服务器配置 (`server`)

```json
{
  "server": {
    "port": 3000,           // 服务端口
    "host": "localhost",    // 主机地址
    "https": false,         // 是否启用HTTPS
    "cors": true,           // 是否启用CORS
    "open": true            // 是否自动打开浏览器
  }
}
```

### 构建配置 (`build`)

```json
{
  "build": {
    "outDir": "dist",           // 输出目录
    "assetsDir": "assets",      // 静态资源目录
    "sourcemap": false,         // 是否生成sourcemap
    "minify": "terser"          // 压缩工具: terser | esbuild
  }
}
```

### 默认值配置 (`defaults`)

```json
{
  "defaults": {
    "learning": {
      "period": 30,                           // 学习周期(天)
      "newWordsPerDay": 10,                   // 每日新学单词数
      "maxReviewPerDay": 30,                  // 每日最大复习数
      "ebbinghausIntervals": [1, 2, 4, 7, 15] // 艾宾浩斯间隔
    },
    "ui": {
      "language": "zh-CN",    // 界面语言
      "theme": "default",      // 主题
      "pageSize": 20          // 分页大小
    },
    "import": {
      "maxFileSize": "10MB",              // 最大文件大小
      "maxWordCount": 1000,               // 最大单词数量
      "supportedFormats": [".xlsx", ".xls", ".csv"] // 支持的格式
    }
  }
}
```

### 存储配置 (`storage`)

```json
{
  "storage": {
    "prefix": "ebbinghaus_",   // localStorage前缀
    "localStorage": true,      // 是否使用localStorage
    "sessionStorage": false,   // 是否使用sessionStorage
    "encrypt": false          // 是否加密存储
  }
}
```

### 功能开关 (`features`)

```json
{
  "features": {
    "debug": false,     // 调试模式
    "analytics": false, // 统计分析
    "pwa": false,      // PWA支持
    "darkMode": false  // 暗色模式
  }
}
```

## 🌍 环境变量配置

可以通过环境变量覆盖配置文件中的设置：

### 服务器配置

```bash
PORT=3000                    # 覆盖 server.port
HOST=localhost               # 覆盖 server.host
HTTPS=false                  # 覆盖 server.https
CORS=true                    # 覆盖 server.cors
OPEN=true                    # 覆盖 server.open
```

### 构建配置

```bash
OUT_DIR=dist                # 覆盖 build.outDir
SOURCEMAP=false             # 覆盖 build.sourcemap
MINIFY=terser               # 覆盖 build.minify
```

### 功能开关

```bash
DEBUG=true                  # 启用调试模式
ANALYTICS=true              # 启用统计分析
```

## 🚀 使用方法

### 1. 使用配置文件

修改 `config/` 目录下的相应配置文件即可。

### 2. 使用环境变量

创建 `.env` 文件或直接在命令行设置：

```bash
# 方法1: 创建.env文件
echo "PORT=8080" > .env

# 方法2: 命令行设置
PORT=8080 npm run dev
```

### 3. 不同环境配置

```bash
# 开发环境 (使用 development.json)
npm run dev

# 生产环境开发模式 (使用 production.json)
npm run dev:prod

# 生产构建
npm run build

# 开发模式构建
npm run build:dev
```

## 📝 配置示例

### 修改开发端口为8080

**方法1: 修改配置文件**
```json
// config/development.json
{
  "server": {
    "port": 8080
  }
}
```

**方法2: 使用环境变量**
```bash
PORT=8080 npm run dev
```

### 启用调试模式

**方法1: 修改配置文件**
```json
// config/development.json
{
  "features": {
    "debug": true
  }
}
```

**方法2: 使用环境变量**
```bash
DEBUG=true npm run dev
```

### 修改学习默认值

```json
// config/app.json 或 development.json
{
  "defaults": {
    "learning": {
      "period": 60,
      "newWordsPerDay": 5,
      "maxReviewPerDay": 15
    }
  }
}
```

## 🛠️ 配置验证

```bash
# 显示当前配置
npm run config:show

# 验证配置文件格式
npm run config:validate
```

## 📱 前端配置访问

在Vue组件中访问配置：

```vue
<script setup>
import { useConfig, useLearningConfig } from '@/composables/useConfig'

// 使用完整配置
const { config, isFeatureEnabled } = useConfig()

// 使用学习配置
const { period, newWordsPerDay } = useLearningConfig()

// 检查功能
if (isFeatureEnabled('debug')) {
  console.log('Debug mode enabled')
}
</script>
```

## 🔒 安全注意事项

1. **敏感信息**: 不要在配置文件中存储敏感信息
2. **环境变量**: 生产环境建议使用环境变量覆盖敏感配置
3. **版本控制**: `.env` 文件应该添加到 `.gitignore`

## 📚 常见问题

### Q: 配置修改后如何生效？
A: 修改配置文件后需要重启开发服务器，环境变量修改后立即生效。

### Q: 如何添加新的配置项？
A: 在相应配置文件中添加新项，并在TypeScript类型定义中更新。

### Q: 配置文件格式错误怎么办？
A: 使用 `npm run config:validate` 验证配置文件格式。

---

更多配置相关问题，请参考项目文档或提交Issue。