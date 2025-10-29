# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

RememberWords 是一个基于艾宾浩斯遗忘曲线的智能学习计划工具，使用 Vue 3 + TypeScript + Electron 构建。应用支持 Web 版本和 macOS 桌面版本。

## 常用命令

### 开发命令

```bash
# Web 开发模式
npm run dev

# Electron 桌面应用开发模式
npm run electron:dev

# Electron 桌面应用调试模式
npm run electron:dev:debug
```

### 构建命令

```bash
# Web 生产构建
npm run build

# Web 预览
npm run preview

# Electron 桌面应用构建
npm run electron:build

# Electron 打包（不重新构建）
npm run electron:pack

# 平台专用构建
npm run electron:build:win    # Windows 便携版
npm run electron:build:mac    # macOS 应用
```

### 代码质量检查

```bash
# TypeScript 类型检查
npm run type-check

# ESLint 检查和修复
npm run lint

# 带类型检查的构建
npm run build:check
```

### 配置管理

```bash
# 显示当前配置
npm run config:show

# 配置验证
npm run config:validate
```

### 图标管理

```bash
# 生成应用图标（从 logo_1_y.png 生成）
npm run icon:generate

# 复制生成的图标到正确位置
npm run icon:copy
```

## 核心架构

### 技术栈
- **前端框架**: Vue 3 + Composition API + TypeScript
- **UI 组件**: Element Plus
- **数据可视化**: ECharts
- **数据处理**: XLSX (SheetJS)
- **构建工具**: Vite
- **桌面应用**: Electron + electron-builder
- **代码质量**: ESLint + Prettier

### 目录结构关键部分

```
src/
├── components/          # Vue 组件
│   ├── DataImport.vue      # 数据导入组件
│   ├── ParameterSettings.vue  # 学习参数设置组件
│   └── PlanViewer.vue      # 学习计划查看组件
├── composables/         # 组合式函数
│   ├── useEbbinghaus.ts    # 艾宾浩斯算法核心实现
│   ├── useExcel.ts         # Excel 处理逻辑
│   └── useStorage.ts       # 本地存储管理
├── types/               # TypeScript 类型定义
│   └── index.ts          # 核心类型（Word, StudySettings, StudyPlan 等）
└── utils/               # 工具函数
    └── sanitize.ts      # 安全处理函数

electron/                 # Electron 主进程代码
├── main.ts             # 主进程入口
├── preload.ts          # 预加载脚本
└── tsconfig.json       # Electron TypeScript 配置

config/                  # 配置文件
├── app.json            # 应用主配置（版本、名称等）
├── development.json    # 开发环境配置
└── production.json     # 生产环境配置

scripts/                 # 构建脚本
└── update-build-config.js  # 配置同步脚本
```

### 核心算法实现

艾宾浩斯遗忘曲线算法实现在 `src/composables/useEbbinghaus.ts` 中：

1. **复习间隔**: 1、2、4、7、15天
2. **算法流程**:
   - 按每日新学数量分配单词
   - 为每个单词安排5个复习时间点
   - 按紧急程度排序复习任务
   - 确保每日学习量不超过限制

### 配置系统

项目使用集中化配置管理：

- **主配置**: `config/app.json` - 包含应用名称、版本、默认设置等
- **环境配置**: `config/development.json` 和 `config/production.json`
- **自动同步**: `scripts/update-build-config.js` 在构建时同步配置到 package.json

### Electron 架构

- **主进程**: `electron/main.ts` - 窗口管理、菜单创建、IPC 处理
- **预加载脚本**: `electron/preload.ts` - 安全桥接主进程和渲染进程
- **构建配置**: electron-builder 配置在 package.json 中，支持 Windows 便携版和 macOS 应用

### 数据流

1. **数据导入**: Excel → `useExcel.ts` → `Word[]` → 本地存储
2. **计划生成**: `Word[]` + `StudySettings` → `useEbbinghaus.ts` → `StudyPlan`
3. **数据可视化**: `StudyPlan` → ECharts 配置 → 图表展示

### 组件通信

- **状态管理**: 使用 Vue 3 Composition API 和 ref/reactive
- **数据持久化**: `useStorage.ts` 封装 localStorage 操作
- **组件通信**: Props 和 Events，通过父组件协调

## 开发注意事项

### 端口配置
- Web 开发服务器默认端口: 3001（可在 config 中配置）
- Electron 开发模式会等待 Web 服务器启动

### 构建配置
- Vite 配置支持相对路径（用于 Electron）
- TypeScript 严格模式启用
- 生产构建使用 Terser 压缩

### 安全考虑
- Electron 使用 contextIsolation 和禁用 nodeIntegration
- XSS 防护：使用 sanitize.ts 进行输入净化
- 本地存储数据加密选项（可配置）

### 艾宾浩斯算法调优
- 复习队列按紧急程度排序
- 支持负载均衡，避免单日学习负担过重
- 详细调试日志便于算法验证

## 故障排除

### 常见问题
1. **白屏问题**: 检查 Vite base 路径配置，生产环境使用相对路径
2. **端口冲突**: 修改 config/app.json 中的端口配置
3. **构建失败**: 运行 `npm run type-check` 检查类型错误
4. **Electron 启动失败**: 确保先运行 `npm run build` 构建前端代码

### 调试技巧
- 使用 `npm run electron:dev:debug` 启动调试模式
- 查看浏览器控制台中的算法日志
- 使用 `npm run config:show` 检查当前配置

## 版本管理

应用版本统一在 `config/app.json` 中管理，构建时会自动同步到：
- package.json version 字段
- Electron 应用名称和版本
- 构建产物命名

修改版本只需编辑 `config/app.json` 中的 `version` 字段即可。