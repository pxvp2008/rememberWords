<template>
  <div class="plan-generator">
    <el-card class="generator-card">
      <template #header>
        <div class="card-header">
          <el-icon><Tools /></el-icon>
          <span>学习计划生成</span>
        </div>
      </template>

      <!-- 设置确认 -->
      <div class="settings-summary" v-if="settings">
        <h3>学习设置确认</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="学习周期" :value="settings.period" suffix="天" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="每日新学" :value="settings.dailyNew" suffix="个" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="每日复习" :value="settings.maxReview" suffix="个" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="单词总数" :value="words.length" suffix="个" />
          </el-col>
        </el-row>

        <div class="start-date-info">
          <el-alert
            :title="`开始日期：${formatDate(settings.startDate)}`"
            type="info"
            show-icon
            :closable="false"
          />
        </div>
      </div>

      <!-- 生成进度 -->
      <div v-if="isGenerating" class="generation-progress">
        <el-alert
          title="正在生成学习计划..."
          type="info"
          show-icon
          :closable="false"
        />

        <div class="progress-content">
          <el-progress
            :percentage="progress"
            :duration="3"
            :stroke-width="15"
            status="success"
          />
          <p class="progress-text">{{ progressText }}</p>
        </div>
      </div>

      <!-- 生成完成 -->
      <div v-else-if="plan" class="generation-complete">
        <el-result
          icon="success"
          title="学习计划生成成功！"
          :sub-title="completeMessage"
        >
          <template #extra>
            <div class="completion-actions">
              <el-button @click="regenerate">重新生成</el-button>
              <el-button type="primary" @click="viewPlan">查看计划</el-button>
            </div>
          </template>
        </el-result>
      </div>

      <!-- 初始状态 -->
      <div v-else class="generation-initial">
        <el-empty description="点击生成按钮开始创建学习计划">
          <template #image>
            <el-icon size="80"><Document /></el-icon>
          </template>
          <el-button type="primary" size="large" @click="startGeneration">
            <el-icon><Tools /></el-icon>
            生成学习计划
          </el-button>
        </el-empty>
      </div>

      <!-- 操作按钮 -->
      <div class="generator-actions">
        <el-button @click="goBack">返回设置</el-button>
        <el-button
          v-if="!plan && !isGenerating"
          type="primary"
          @click="startGeneration"
          :loading="isGenerating"
        >
          {{ isGenerating ? '生成中...' : '生成学习计划' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Tools, Document } from '@element-plus/icons-vue'
import { useStorage } from '@/composables/useStorage'
import { useEbbinghaus } from '@/composables/useEbbinghaus'

const emit = defineEmits<{
  back: []
  next: []
}>()

const { words, settings } = useStorage()
const { generateStudyPlan, isGenerating, plan } = useEbbinghaus()

const progress = ref(0)
const progressText = ref('')

let progressTimer: NodeJS.Timeout | null = null

// 完成信息
const completeMessage = computed(() => {
  if (!plan.value) return ''

  const totalDays = plan.value.tasks.length
  const totalWords = plan.value.originalWords.length
  const averageTasks = Math.round(
    plan.value.tasks.reduce((sum, task) => sum + task.newWords.length + task.reviewWords.length, 0) / totalDays
  )

  return `已为您生成了 ${totalDays} 天的学习计划，涵盖 ${totalWords} 个单词，平均每日学习 ${averageTasks} 个任务`
})

// 格式化日期
const formatDate = (date: Date): string => {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 开始生成计划
const startGeneration = async () => {
  if (!words.value || words.value.length === 0) {
    ElMessage.warning('请先导入单词数据')
    return
  }

  if (!settings.value) {
    ElMessage.warning('请先设置学习参数')
    return
  }

  progress.value = 0

  // 模拟生成过程
  progressTimer = setInterval(() => {
    if (progress.value < 90) {
      progress.value += 10
      updateProgressText(progress.value)
    }
  }, 200)

  try {
    await generateStudyPlan(words.value, settings.value)
    progress.value = 100
    progressText.value = '计划生成完成！'

    setTimeout(() => {
      if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
      }
      ElMessage.success('学习计划生成成功！')
    }, 500)
  } catch (error) {
    console.error('生成计划失败:', error)
    ElMessage.error('生成计划失败，请重试')
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
  }
}

// 更新进度文本
const updateProgressText = (progressValue: number) => {
  const texts = [
    '正在分析单词数据...',
    '正在分配新学任务...',
    '正在计算复习时间...',
    '正在优化学习负荷...',
    '正在生成完整计划...',
    '即将完成...'
  ]

  const index = Math.floor(progressValue / 20)
  progressText.value = texts[Math.min(index, texts.length - 1)]
}

// 重新生成
const regenerate = () => {
  plan.value = null
  progress.value = 0
  progressText.value = ''
}

// 查看计划
const viewPlan = () => {
  emit('next')
}

// 返回
const goBack = () => {
  emit('back')
}
</script>

<style scoped>
.plan-generator {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.generator-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.settings-summary {
  margin-bottom: 30px;
}

.settings-summary h3 {
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.start-date-info {
  margin-top: 16px;
}

.generation-progress {
  margin: 30px 0;
}

.progress-content {
  margin: 20px 0;
  text-align: center;
}

.progress-text {
  margin-top: 16px;
  font-size: 16px;
  color: var(--el-text-color-regular);
}

.generation-complete {
  margin: 30px 0;
}

.completion-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.generation-initial {
  margin: 30px 0;
  text-align: center;
}

.generator-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
  margin-top: 30px;
}
</style>