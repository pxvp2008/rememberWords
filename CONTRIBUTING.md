# 🤝 贡献指南

感谢您对 RememberWords 项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、问题报告和功能建议。

## 📋 目录

- [行为准则](#-行为准则)
- [开始贡献](#-开始贡献)
- [开发流程](#-开发流程)
- [提交规范](#-提交规范)
- [代码规范](#-代码规范)
- [测试指南](#-测试指南)
- [文档贡献](#-文档贡献)
- [问题报告](#-问题报告)
- [功能请求](#-功能请求)

## 🤝 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们承诺：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性暗示或不当的语言
- 人身攻击或政治攻击
- 公开或私下骚扰
- 未经明确许可发布他人的私人信息
- 其他在专业环境中可能被认为不当的行为

## 🚀 开始贡献

### 环境准备

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 fork 项目到你的账户
   # 然后克隆你的 fork
   git clone https://github.com/YOUR_USERNAME/rememberWords.git
   cd rememberWords
   ```

2. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/original-owner/rememberWords.git
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 开发环境设置

#### VS Code 推荐配置

创建 `.vscode/extensions.json`：
```json
{
  "recommendations": [
    "vue.volar",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

创建 `.vscode/settings.json`：
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 🔄 开发流程

### 1. 创建分支

```bash
# 确保主分支是最新的
git checkout main
git pull upstream main

# 创建新分支
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 2. 进行开发

- 遵循项目的代码规范
- 确保代码通过所有测试
- 添加必要的测试用例
- 更新相关文档

### 3. 提交更改

```bash
# 添加更改
git add .

# 提交更改（遵循提交规范）
git commit -m "feat: add new feature description"

# 推送到你的 fork
git push origin feature/your-feature-name
```

### 4. 创建 Pull Request

1. 在 GitHub 上访问你的 fork
2. 点击 "New Pull Request"
3. 选择正确的分支
4. 填写 PR 模板
5. 提交 PR

## 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

### 格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 类型说明

- `feat`: 新功能
- `fix`: 问题修复
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
feat(ui): add calendar view for study plan
fix(excel): resolve import issue with special characters
docs(api): update useEbbinghaus function documentation
style: improve button spacing
refactor(storage): optimize localStorage operations
perf(chart): improve rendering performance
```

## 📐 代码规范

### TypeScript

```typescript
// ✅ 好的示例
interface StudySettings {
  period: number
  dailyNew: number
  maxReview: number
  startDate: string
}

const generateStudyPlan = (words: Word[], settings: StudySettings): StudyPlan => {
  // 实现
}

// ❌ 避免使用 any
const processData = (data: any): any => {
  // 不要这样做
}
```

### Vue 组件

```vue
<template>
  <main class="app-container">
    <header class="app-header">
      <h1>{{ title }}</h1>
    </header>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Word } from '@/types'

interface Props {
  initialData?: Word[]
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => []
})

const emit = defineEmits<{
  update: [data: Word[]]
  error: [message: string]
}>()

// 响应式数据
const loading = ref(false)
const error = ref('')

// 计算属性
const processedData = computed(() => {
  return props.initialData.map(item => ({
    ...item,
    processed: true
  }))
})
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
```

### 命名规范

- **组件**: PascalCase (`DataImport.vue`)
- **函数/变量**: camelCase (`generateStudyPlan`)
- **常量**: UPPER_SNAKE_CASE (`EBBINGHAUS_INTERVALS`)
- **文件**: kebab-case (`use-ebbinghaus.ts`)

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 测试结构

```
tests/
├── unit/                  # 单元测试
│   ├── composables/
│   └── utils/
├── integration/           # 集成测试
└── e2e/                  # 端到端测试
```

### 测试示例

```typescript
// tests/composables/useEbbinghaus.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useEbbinghaus } from '@/composables/useEbbinghaus'

describe('useEbbinghaus', () => {
  let ebbinghaus: ReturnType<typeof useEbbinghaus>

  beforeEach(() => {
    ebbinghaus = useEbbinghaus()
  })

  it('should generate study plan correctly', () => {
    const words = [
      { id: '1', word: 'apple', meaning: '苹果' }
    ]
    const settings = {
      period: 30,
      dailyNew: 1,
      maxReview: 5,
      startDate: '2024-01-01'
    }

    const plan = ebbinghaus.generatePlan(words, settings)

    expect(plan.tasks).toHaveLength(30)
    expect(plan.originalWords).toEqual(words)
  })
})
```

## 📖 文档贡献

### 文档类型

- **API 文档**: 函数和类的说明
- **用户指南**: 如何使用功能
- **开发文档**: 如何参与开发
- **示例代码**: 实际使用示例

### 文档规范

- 使用清晰、简洁的语言
- 提供代码示例
- 包含必要的前置条件
- 更新相关目录和链接

### 文档提交

```bash
# 文档相关的提交
git commit -m "docs(readme): update installation instructions"
git commit -m "docs(api): add useExcel function documentation"
```

## 🐛 问题报告

### 报告 Bug

使用以下模板报告问题：

```markdown
## Bug 描述
简要描述遇到的问题

## 重现步骤
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 期望行为
描述你期望发生的情况

## 实际行为
描述实际发生的情况

## 环境信息
- OS: [例如 macOS 13.0]
- 浏览器: [例如 Chrome 120]
- 版本: [例如 v1.0.0]

## 截图
如果适用，添加截图来帮助解释问题

## 附加信息
添加关于问题的任何其他信息
```

### 安全问题

如果你发现安全相关问题，请不要在公开的 issue 中报告，而是发送邮件到：security@example.com

## 💡 功能请求

### 请求新功能

使用以下模板：

```markdown
## 功能描述
清晰简洁地描述你想要的功能

## 问题背景
描述这个功能要解决的问题

## 解决方案
描述你希望的解决方案

## 替代方案
描述你考虑过的其他解决方案

## 附加信息
添加关于功能请求的任何其他信息
```

## 📊 Pull Request 模板

```markdown
## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性更改
- [ ] 文档更新

## 变更描述
简要描述这个 PR 的变更

## 相关 Issue
关闭 #issue_number

## 测试
描述你如何测试了这些变更

## 检查清单
- [ ] 我的代码遵循项目的代码规范
- [ ] 我已经进行了自我审查
- [ ] 我已经添加了必要的注释
- [ ] 我的更改生成了新的警告
- [ ] 我已经添加了测试来证明我的修复是有效的或我的功能可以工作
- [ ] 新的和现有的单元测试都通过了我的更改
- [ ] 任何依赖的更改都已经合并和发布
```

## 🎉 贡献者认可

### 贡献者列表

感谢所有为这个项目做出贡献的人！

<!-- 贡献者列表会自动更新 -->

### 如何被认可

当你的 PR 被合并后，你会自动被添加到贡献者列表中。

## 📞 联系方式

- **项目主页**: https://github.com/your-username/rememberWords
- **问题反馈**: https://github.com/your-username/rememberWords/issues
- **讨论区**: https://github.com/your-username/rememberWords/discussions
- **邮箱**: your-email@example.com

---

再次感谢您的贡献！🎉