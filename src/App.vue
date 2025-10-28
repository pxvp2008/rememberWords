<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 头部 -->
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo">
            <el-icon size="24"><Notebook /></el-icon>
            <h1>艾宾浩斯学习计划工具</h1>
          </div>
          <div class="header-actions">
            <el-button @click="clearAllData" type="danger" size="small" plain>
              清除所有数据
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 主体内容 -->
      <el-main class="app-main">
        <!-- 步骤指示器 -->
        <el-steps :active="currentStep" finish-status="success" class="progress-steps">
          <el-step title="数据导入" description="导入Excel单词表" />
          <el-step title="计划设置" description="配置学习计划" />
          <el-step title="查看计划" description="预览和导出计划" />
        </el-steps>

        <!-- 步骤内容 -->
        <div class="step-content">
          <!-- 数据导入 -->
          <DataImport
            v-if="currentStep === 0"
            @next="nextStep"
            :key="`data-import-${words.length}`"
          />

          <!-- 参数设置 -->
          <ParameterSettings
            v-else-if="currentStep === 1"
            @back="prevStep"
            @next="generateAndShowPlan"
            :key="`settings-${currentStep}`"
          />

          <!-- 计划查看 -->
          <PlanViewer
            v-else-if="currentStep === 2"
            @back="prevStep"
            @regenerate="regeneratePlan"
            :key="`plan-viewer-${currentStep}`"
          />
        </div>
      </el-main>

      <!-- 页脚 -->
      <el-footer class="app-footer">
        <p>艾宾浩斯学习计划工具 - 基于遗忘曲线的科学学习方案</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Notebook } from '@element-plus/icons-vue'
import DataImport from '@/components/DataImport.vue'
import ParameterSettings from '@/components/ParameterSettings.vue'
import PlanViewer from '@/components/PlanViewer.vue'
import { useStorage } from '@/composables/useStorage'
import { useEbbinghaus } from '@/composables/useEbbinghaus'

const { clearAll, words } = useStorage()
const { clearPlan } = useEbbinghaus()

const currentStep = ref(0)

// 当前步骤标题
const currentStepTitle = computed(() => {
  const titles = ['数据导入', '参数设置', '查看计划']
  return titles[currentStep.value]
})

// 下一步
const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 生成计划并直接显示
const generateAndShowPlan = async () => {
  currentStep.value = 2 // 直接跳转到查看计划页面
}

// 重新生成计划
const regeneratePlan = () => {
  currentStep.value = 1 // 跳转到参数设置页面
}

// 清除所有数据
const clearAllData = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清除所有导入的单词、设置和学习计划，且无法恢复。确定要继续吗？',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 清除数据
    clearAll()
    clearPlan()

    // 重置到第一步
    currentStep.value = 0

    // 强制重新渲染页面组件
    await nextTick()

    ElMessage.success('所有数据已清除')
  } catch {
    // 用户取消操作
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.progress-steps {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.step-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}

.app-footer {
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.app-footer p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .logo h1 {
    font-size: 18px;
  }

  .app-main {
    padding: 16px;
  }

  .progress-steps {
    padding: 16px;
  }

  .step-content {
    padding: 16px;
  }

  :deep(.el-step__title) {
    font-size: 12px !important;
  }

  :deep(.el-step__description) {
    font-size: 10px !important;
  }
}

/* 步骤条样式优化 */
:deep(.el-step__title.is-finish) {
  color: var(--el-color-success);
}

:deep(.el-step__title.is-process) {
  color: var(--el-color-primary);
  font-weight: 600;
}

:deep(.el-step__description.is-finish) {
  color: var(--el-color-success);
}

:deep(.el-step__description.is-process) {
  color: var(--el-color-primary);
}


/* 动画效果 */
.step-content {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

#app {
  min-height: 100vh;
}

/* Element Plus 样式覆盖 */
.el-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.el-button {
  border-radius: 8px;
  font-weight: 500;
}

.el-input__wrapper {
  border-radius: 8px;
}

.el-select .el-input .el-input__wrapper {
  border-radius: 8px;
}

.el-upload-dragger {
  border-radius: 12px;
  border: 2px dashed var(--el-border-color);
  transition: all 0.3s ease;
}

.el-upload-dragger:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>