<template>
  <div class="parameter-settings">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <el-icon><Setting /></el-icon>
          <span>学习计划设置</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="settings"
        :rules="rules"
        label-width="110px"
        class="settings-form"
      >
        <el-form-item label="学习周期" prop="period">
          <div class="form-input-group">
            <el-input-number
              v-model="settings.period"
              :min="7"
              :max="365"
              :step="1"
              controls-position="right"
              class="form-input"
            />
            <span class="unit">天</span>
            <span class="form-tip">建议根据单词总量和学习目标设置，通常30-90天较为合适</span>
          </div>
        </el-form-item>

        <el-form-item label="每日新学单词" prop="dailyNew">
          <div class="form-input-group">
            <el-input-number
              v-model="settings.dailyNew"
              :min="1"
              :max="100"
              :step="1"
              controls-position="right"
              class="form-input"
            />
            <span class="unit">个</span>
            <span class="form-tip">根据个人时间和记忆能力设置，建议5-20个</span>
          </div>
        </el-form-item>

        <el-form-item label="每日最大复习" prop="maxReview">
          <div class="form-input-group">
            <el-input-number
              v-model="settings.maxReview"
              :min="1"
              :max="200"
              :step="1"
              controls-position="right"
              class="form-input"
            />
            <span class="unit">个</span>
            <span class="form-tip">复习是记忆的关键，建议设置为每日新学单词的2-3倍</span>
          </div>
        </el-form-item>

        <el-form-item label="起始日期" prop="startDate">
          <div class="form-input-group">
            <el-date-picker
              v-model="settings.startDate"
              type="date"
              placeholder="选择开始日期"
              :disabled-date="disabledDate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="form-input"
            />
            <span class="form-tip">选择今天或未来的日期作为学习计划的开始时间</span>
          </div>
        </el-form-item>
      </el-form>

      <!-- 预计统计信息 -->
      <el-alert
        v-if="words.length > 0"
        :title="statisticsText"
        type="info"
        show-icon
        :closable="false"
        class="statistics-alert"
      />

      <div class="form-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="generatePlan" :loading="isGenerating">
          生成学习计划
        </el-button>
      </div>
    </el-card>

    <!-- 艾宾浩斯遗忘曲线说明 -->
    <el-card class="explanation-card">
      <template #header>
        <div class="card-header">
          <el-icon><InfoFilled /></el-icon>
          <span>艾宾浩斯遗忘曲线</span>
        </div>
      </template>

      <div class="curve-info">
        <p>
          艾宾浩斯遗忘曲线描述了人类大脑对新事物遗忘的规律。根据研究，如果在学习后的特定时间点进行复习，可以大大提高记忆效果。
        </p>

        <h4>最佳复习时间点：</h4>
        <ul>
          <li>第1次复习：学习后第1天</li>
          <li>第2次复习：学习后第2天</li>
          <li>第3次复习：学习后第4天</li>
          <li>第4次复习：学习后第7天</li>
          <li>第5次复习：学习后第15天</li>
        </ul>

        <el-alert
          title="提示"
          description="按照这个规律安排复习，可以将短期记忆转化为长期记忆，显著提高学习效率。"
          type="success"
          show-icon
          :closable="false"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Setting, InfoFilled, Edit } from '@element-plus/icons-vue'
import { useStorage } from '@/composables/useStorage'
import { useEbbinghaus } from '@/composables/useEbbinghaus'
import type { StudySettings } from '@/types'
import { EBBINGHAUS_INTERVALS } from '@/types'

const emit = defineEmits<{
  back: []
  next: []
}>()

const { words, settings } = useStorage()
const { generateStudyPlan, isGenerating } = useEbbinghaus()

const formRef = ref<FormInstance>()


// 表单验证规则
const rules: FormRules<StudySettings> = {
  period: [
    { required: true, message: '请输入学习周期', trigger: 'blur' },
    { type: 'number', min: 7, max: 365, message: '学习周期应在7-365天之间', trigger: 'blur' }
  ],
  dailyNew: [
    { required: true, message: '请输入每日新学单词数', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '每日新学单词数应在1-100个之间', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && settings.value.maxReview && value > settings.value.maxReview) {
        callback(new Error('每日新学单词数不应超过每日最大复习数'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  maxReview: [
    { required: true, message: '请输入每日最大复习数', trigger: 'blur' },
    { type: 'number', min: 1, max: 200, message: '每日最大复习数应在1-200个之间', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && settings.value.dailyNew && value < settings.value.dailyNew) {
        callback(new Error('每日最大复习数不应少于每日新学单词数'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择起始日期', trigger: 'change' }
  ]
}

// 禁用过去的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}



// 统计信息
const statisticsText = computed(() => {
  if (words.value.length === 0) return ''

  const totalDays = settings.value.period
  const totalNewWords = Math.min(words.value.length, settings.value.dailyNew * totalDays)
  const estimatedDays = Math.ceil(words.value.length / settings.value.dailyNew)

  return `预计需要 ${estimatedDays} 天完成所有单词学习，总计安排约 ${totalNewWords * 6} 次学习任务（含复习）`
})


// 监听设置变化，自动验证
watch(() => settings.value, () => {
  formRef.value?.validate().catch(() => {})
}, { deep: true })

// 生成学习计划
const generatePlan = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (words.value.length === 0) {
      ElMessage.warning('请先导入单词数据')
      return
    }

    // 检查参数合理性
    const totalCapacity = settings.value.dailyNew * settings.value.period
    if (totalCapacity < words.value.length) {
      try {
        await ElMessageBox.confirm(
          `当前设置在${settings.value.period}天内最多能学习${totalCapacity}个单词，但您导入了${words.value.length}个单词。是否调整参数？`,
          '参数提示',
          {
            confirmButtonText: '自动调整',
            cancelButtonText: '继续生成',
            type: 'warning'
          }
        )

        // 自动调整参数
        const suggestedDays = Math.ceil(words.value.length / settings.value.dailyNew)
        settings.value.period = Math.min(suggestedDays, 365)
      } catch {
        // 用户选择继续生成
      }
    }

    await generateStudyPlan(words.value, settings.value)
    ElMessage.success('学习计划生成成功！')
    emit('next')

  } catch (error) {
    console.error('生成计划失败:', error)
  }
}

// 获取格式化的当前日期
const getCurrentDateString = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 初始化起始日期为当前日期
const initializeStartDate = () => {
  const today = getCurrentDateString()

  if (!settings.value.startDate) {
    // 如果没有设置起始日期，设置为当前日期的字符串格式
    settings.value.startDate = today
  } else {
    // 如果已设置日期，检查是否为字符串格式
    const startDate = typeof settings.value.startDate === 'string'
      ? settings.value.startDate
      : new Date(settings.value.startDate).toISOString().split('T')[0]

    // 检查日期是否有效
    const parsedDate = new Date(startDate)
    if (isNaN(parsedDate.getTime()) || parsedDate < new Date(today)) {
      // 如果日期无效或是过去的日期，设置为今天
      settings.value.startDate = today
    }
  }
}

// 组件挂载时初始化
onMounted(() => {
  initializeStartDate()
})

// 返回上一页
const goBack = () => {
  emit('back')
}
</script>

<style scoped>
.parameter-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 12px;
}

.settings-card {
  margin-bottom: 12px;
}

.explanation-card {
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.settings-form {
  padding: 18px 20px;
}

.settings-form .el-form-item {
  margin-bottom: 18px;
}

.settings-form .el-form-item__content {
  display: flex;
  align-items: center;
}

.settings-form .el-form-item__label {
  display: flex;
  align-items: center;
  height: 32px;
  justify-content: flex-start;
  margin-right: 12px;
  white-space: nowrap;
  font-weight: 500;
  font-size: 14px;
}

.unit {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
}

.form-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  line-height: 1.3;
  padding: 3px 8px;
  background: linear-gradient(to right, var(--el-color-info-light-9), transparent);
  border-left: 2px solid var(--el-color-info);
  border-radius: 3px;
  transition: all 0.3s ease;
  flex-shrink: 1;
  margin-left: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-tip:hover {
  background: var(--el-color-info-light-8);
  transform: translateX(1px);
}

.auto-tag {
  margin-left: 8px;
  font-size: 11px;
  height: 20px;
  line-height: 18px;
  border-radius: 10px;
  background: var(--el-color-info-light-8);
  color: var(--el-color-info);
  border: 1px solid var(--el-color-info-light-5);
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.auto-tag.editable-tag {
  cursor: default;
  background: var(--el-color-success-light-8);
  color: var(--el-color-success);
  border: 1px solid var(--el-color-success-light-5);
}

.auto-tag.editable-tag:hover {
  background: var(--el-color-success-light-7);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.edit-icon {
  margin-left: 4px;
  opacity: 0.8;
}

.statistics-alert {
  margin: 12px 0;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid var(--el-border-color-light);
}

.curve-info {
  line-height: 1.4;
}

.curve-info h4 {
  margin: 10px 0 5px 0;
  color: var(--el-text-color-primary);
}

.curve-info ul {
  margin: 5px 0 10px 18px;
  padding: 0;
}

.curve-info li {
  margin-bottom: 2px;
  color: var(--el-text-color-regular);
}

/* 统一所有输入框宽度 - 基于学习周期输入框 */
:deep(.el-input-number) {
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;
}

:deep(.el-input-number .el-input__inner) {
  width: 100% !important;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
  width: 100% !important;
  min-width: 200px !important;
  max-width: 200px !important;
}

:deep(.el-input-number .el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

/* 确保日期选择器与数字输入框宽度一致 */
:deep(.el-date-picker) {
  width: 200px !important;
  min-width: 200px !important;
  max-width: 200px !important;
}

:deep(.el-date-picker .el-input) {
  width: 100% !important;
}

:deep(.el-date-picker .el-input__inner) {
  width: 100% !important;
}

:deep(.el-date-picker .el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
  width: 100% !important;
  min-width: 200px !important;
  max-width: 200px !important;
}

:deep(.el-date-picker .el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}
</style>