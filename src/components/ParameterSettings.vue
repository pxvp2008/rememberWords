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

        <el-form-item label="跳过周末">
          <div class="form-input-group">
            <el-switch
              v-model="settings.skipWeekends"
              :active-value="true"
              :inactive-value="false"
              class="form-switch"
            />
            <div class="weekend-info">
              <el-alert
                v-if="settings.skipWeekends"
                title="开启跳过周末后，学习计划只会在周一至周五安排任务，周六和周日将自动跳过。这会延长整个学习计划的日历时间，但保持学习天数不变。"
                type="info"
                :closable="false"
                show-icon
                class="weekend-alert"
              />
              <el-alert
                v-else
                title="包含所有日期的模式会在每一天（包括周末）都安排学习任务，适合需要高强度学习的情况。"
                type="info"
                :closable="false"
                show-icon
                class="weekend-alert"
              />
            </div>
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
import { EBBINGHAUS_INTERVALS, DateUtils } from '@/types'
import { handleValidationError, handleAlgorithmError } from '@/utils/errorHandler'

const emit = defineEmits<{
  back: []
  next: []
}>()

const { words, settings } = useStorage()
const { generateStudyPlan, isGenerating } = useEbbinghaus()

const formRef = ref<FormInstance>()


// 表单验证规则
const validateNewVsReview = (rule: any, value: number, callback: Function, isDailyNew: boolean) => {
  try {
    const dailyNew = settings.value.dailyNew
    const maxReview = settings.value.maxReview

    if (!dailyNew || !maxReview) {
      callback()
      return
    }

    if (isDailyNew && value > maxReview) {
      callback(new Error('每日新学单词数不应超过每日最大复习数'))
    } else if (!isDailyNew && value < dailyNew) {
      callback(new Error('每日最大复习数不应少于每日新学单词数'))
    } else {
      callback()
    }
  } catch (error) {
    handleValidationError('表单验证失败', { rule, value, error })
    callback()
  }
}

const rules: FormRules<StudySettings> = {
  period: [
    { required: true, message: '请输入学习周期', trigger: 'blur' },
    {
      type: 'number',
      min: 7,
      max: 365,
      message: '学习周期应在7-365天之间',
      trigger: 'blur'
    }
  ],
  dailyNew: [
    { required: true, message: '请输入每日新学单词数', trigger: 'blur' },
    {
      type: 'number',
      min: 1,
      max: 100,
      message: '每日新学单词数应在1-100个之间',
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => validateNewVsReview(rule, value, callback, true),
      trigger: 'blur'
    }
  ],
  maxReview: [
    { required: true, message: '请输入每日最大复习数', trigger: 'blur' },
    {
      type: 'number',
      min: 1,
      max: 200,
      message: '每日最大复习数应在1-200个之间',
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => validateNewVsReview(rule, value, callback, false),
      trigger: 'blur'
    }
  ],
  startDate: [
    { required: true, message: '请选择起始日期', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        try {
          if (!value) {
            callback(new Error('请选择起始日期'))
            return
          }

          if (!DateUtils.isValidDateString(value)) {
            callback(new Error('请选择有效的日期'))
            return
          }

          const selectedDate = DateUtils.parseDate(value)
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          if (selectedDate < today) {
            callback(new Error('起始日期不能是过去的日期'))
            return
          }

          callback()
        } catch (error) {
          handleValidationError('日期验证失败', { value, error })
          callback(new Error('日期格式不正确'))
        }
      },
      trigger: 'change'
    }
  ]
}

// 禁用过去的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}



// 使用实际艾宾浩斯算法预估学习天数和日历天数
const estimateStudyDaysWithEbbinghaus = (totalWords: number, dailyNew: number, maxReview: number, skipWeekends: boolean, startDate: string): { studyDays: number; calendarDays: number; weekendDays: number; weekendCount: number; endDate: string } => {
  if (totalWords === 0 || dailyNew === 0) return { studyDays: 0, calendarDays: 0, weekendDays: 0, weekendCount: 0, endDate: startDate }

  // 创建简化的单词数据用于预估
  const mockWords: Array<{ id: string; word: string; meaning: string }> = []
  for (let i = 0; i < totalWords; i++) {
    mockWords.push({
      id: `word_${i}`,
      word: `word_${i}`,
      meaning: `meaning_${i}`
    })
  }

  try {
    const tasks = []
    let reviewQueue = []
    let wordIndex = 0

    if (skipWeekends) {
      // 跳过周末模式
      let actualCalendarDay = 0
      const MAX_DAYS = 730

      while (wordIndex < totalWords || reviewQueue.length > 0) {
        if (actualCalendarDay > MAX_DAYS) break

        let dateString = DateUtils.addDays(startDate, actualCalendarDay)

        if (DateUtils.isWeekend(dateString)) {
          actualCalendarDay++
          continue
        }

        const newWords: any[] = []
        const reviewWords: any[] = []

        // 分配新学单词
        const newWordsCount = Math.min(dailyNew, totalWords - wordIndex)
        for (let i = 0; i < newWordsCount; i++) {
          if (wordIndex < totalWords) {
            const word = mockWords[wordIndex]
            newWords.push(word)
            wordIndex++

            // 安排复习任务
            for (const interval of EBBINGHAUS_INTERVALS) {
              let reviewDateStr = DateUtils.addDays(dateString, interval)
              while (DateUtils.isWeekend(reviewDateStr)) {
                reviewDateStr = DateUtils.addDays(reviewDateStr, 1)
              }
              reviewQueue.push({
                word,
                reviewDate: reviewDateStr,
                reviewCount: EBBINGHAUS_INTERVALS.indexOf(interval) + 1
              })
            }
          }
        }

        // 处理复习任务
        const todayReviews = reviewQueue.filter(item => item.reviewDate === dateString)
        const reviewCount = Math.min(todayReviews.length, maxReview)

        todayReviews.sort((a, b) => a.reviewCount - b.reviewCount)
        for (let i = 0; i < Math.min(reviewCount, todayReviews.length); i++) {
          const reviewItem = todayReviews[i]
          reviewWords.push(reviewItem.word)
        }

        // 处理延期复习任务
        if (todayReviews.length > maxReview) {
          const remainingReviews = todayReviews.slice(maxReview)
          reviewQueue = reviewQueue.filter(item => item.reviewDate !== dateString)

          let nextDate = DateUtils.addDays(dateString, 1)
          while (DateUtils.isWeekend(nextDate)) {
            nextDate = DateUtils.addDays(nextDate, 1)
          }

          for (const reviewItem of remainingReviews) {
            reviewQueue.push({
              word: reviewItem.word,
              reviewDate: nextDate,
              reviewCount: reviewItem.reviewCount
            })
          }
        } else {
          reviewQueue = reviewQueue.filter(item => item.reviewDate !== dateString)
        }

        // 保存当天的任务
        if (newWords.length > 0 || reviewWords.length > 0) {
          tasks.push({
            date: dateString,
            newWords,
            reviewWords
          })
        }

        actualCalendarDay++
      }

      // 计算实际的日历天数和准确的周末信息
      const studyDays = tasks.length
      let calendarDays = actualCalendarDay
      let endDate = DateUtils.addDays(startDate, calendarDays - 1)

      // 在跳过周末模式下，如果最后一天是周五，包含接下来的周末
      const lastDate = new Date(endDate + 'T00:00:00.000Z')
      if (lastDate.getDay() === 5) { // 如果是周五
        // 包含接下来的周末，因为这是计划的自然延伸
        calendarDays += 2
        endDate = DateUtils.addDays(endDate, 2)
      } else if (lastDate.getDay() === 6) { // 如果是周六
        calendarDays += 1
        endDate = DateUtils.addDays(endDate, 1)
      }

      // 准确计算跳过的周末信息
      let weekendDays = 0
      let weekendCount = 0
      let currentWeekend = false

      for (let i = 0; i < calendarDays; i++) {
        const currentDate = DateUtils.addDays(startDate, i)
        if (DateUtils.isWeekend(currentDate)) {
          weekendDays++
          if (!currentWeekend) {
            weekendCount++
            currentWeekend = true
          }
        } else {
          currentWeekend = false
        }
      }

      return { studyDays, calendarDays, weekendDays, weekendCount, endDate }

    } else {
      // 传统模式（包含周末）
      let dayCount = 0
      const MAX_DAYS = 730

      while (wordIndex < totalWords || reviewQueue.length > 0) {
        if (dayCount > MAX_DAYS) break

        const dateString = DateUtils.addDays(startDate, dayCount)
        dayCount++

        const newWords: any[] = []
        const reviewWords: any[] = []

        // 分配新学单词
        const newWordsCount = Math.min(dailyNew, totalWords - wordIndex)
        for (let i = 0; i < newWordsCount; i++) {
          if (wordIndex < totalWords) {
            const word = mockWords[wordIndex]
            newWords.push(word)
            wordIndex++

            // 安排复习任务
            for (const interval of EBBINGHAUS_INTERVALS) {
              const reviewDateStr = DateUtils.addDays(dateString, interval)
              reviewQueue.push({
                word,
                reviewDate: reviewDateStr,
                reviewCount: EBBINGHAUS_INTERVALS.indexOf(interval) + 1
              })
            }
          }
        }

        // 处理复习任务
        const todayReviews = reviewQueue.filter(item => item.reviewDate === dateString)
        const reviewCount = Math.min(todayReviews.length, maxReview)

        todayReviews.sort((a, b) => a.reviewCount - b.reviewCount)
        for (let i = 0; i < Math.min(reviewCount, todayReviews.length); i++) {
          const reviewItem = todayReviews[i]
          reviewWords.push(reviewItem.word)
        }

        // 处理延期复习任务
        if (todayReviews.length > maxReview) {
          const remainingReviews = todayReviews.slice(maxReview)
          reviewQueue = reviewQueue.filter(item => item.reviewDate !== dateString)

          const nextDate = DateUtils.addDays(dateString, 1)
          for (const reviewItem of remainingReviews) {
            reviewQueue.push({
              word: reviewItem.word,
              reviewDate: nextDate,
              reviewCount: reviewItem.reviewCount
            })
          }
        } else {
          reviewQueue = reviewQueue.filter(item => item.reviewDate !== dateString)
        }

        // 保存当天的任务
        if (newWords.length > 0 || reviewWords.length > 0) {
          tasks.push({
            date: dateString,
            newWords,
            reviewWords
          })
        }
      }

      const studyDays = tasks.length
      const calendarDays = dayCount
      const endDate = DateUtils.addDays(startDate, calendarDays - 1)

      return { studyDays, calendarDays, weekendDays: 0, weekendCount: 0, endDate }
    }

  } catch (error) {
    console.warn('预估学习天数失败，使用简化计算:', error)
    // 降级到简化计算
    const studyDays = Math.ceil(totalWords / dailyNew)
    const calendarDays = skipWeekends ? studyDays + Math.floor(studyDays / 5) * 2 : studyDays
    const endDate = DateUtils.addDays(startDate, calendarDays - 1)
    const weekendDays = skipWeekends ? Math.floor(studyDays / 5) * 2 : 0
    const weekendCount = skipWeekends ? Math.floor(studyDays / 5) : 0
    return { studyDays, calendarDays, weekendDays, weekendCount, endDate }
  }
}

// 统计信息
const statisticsText = computed(() => {
  if (words.value.length === 0) return ''

  const totalDays = settings.value.period
  const totalNewWords = Math.min(words.value.length, settings.value.dailyNew * totalDays)

  // 使用实际艾宾浩斯算法预估学习天数和日历天数
  const estimation = estimateStudyDaysWithEbbinghaus(
    words.value.length,
    settings.value.dailyNew,
    settings.value.maxReview,
    settings.value.skipWeekends,
    settings.value.startDate
  )

  // 使用预估算法返回的准确数据
  if (settings.value.skipWeekends) {
    // 跳过周末模式：使用准确的周末数量和天数
    return `预计需要 ${estimation.studyDays} 个学习日（工作日），日历时间跨度 ${estimation.calendarDays} 天（跳过 ${estimation.weekendCount} 个周末，共 ${estimation.weekendDays} 天），总计安排约 ${totalNewWords * 6} 次学习任务（含复习）`
  } else {
    // 传统模式：包含所有日期
    return `预计需要 ${estimation.studyDays} 天完成所有单词学习，总计安排约 ${totalNewWords * 6} 次学习任务（含复习）`
  }
})


// 监听设置变化，自动验证
watch(() => settings.value, () => {
  formRef.value?.validate().catch(() => {})
}, { deep: true })

// 生成学习计划
const generatePlan = async () => {
  if (!formRef.value) {
    handleValidationError('表单引用不存在')
    return
  }

  try {
    // 验证表单
    await formRef.value.validate()

    // 检查是否有单词数据
    if (words.value.length === 0) {
      ElMessage.warning('请先导入单词数据')
      return
    }

    // 验证学习容量
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

        ElMessage.info(`已自动调整学习周期为 ${settings.value.period} 天`)
      } catch {
        // 用户选择继续生成，不进行调整
      }
    }

    // 验证日期有效性
    if (!DateUtils.isValidDateString(settings.value.startDate)) {
      handleValidationError('起始日期格式无效')
      return
    }

    // 生成学习计划
    await generateStudyPlan(words.value, settings.value)
    ElMessage.success('学习计划生成成功！')
    emit('next')

  } catch (error) {
    if (error instanceof Error) {
      // 表单验证错误
      if (error.message.includes('validation')) {
        handleValidationError('表单验证失败', { error })
        return
      }
    }

    handleAlgorithmError('生成学习计划失败', {
      error,
      settings: settings.value,
      wordsCount: words.value.length
    })
  }
}

// 初始化起始日期为当前日期
const initializeStartDate = () => {
  try {
    const today = DateUtils.today()

    if (!settings.value.startDate) {
      // 如果没有设置起始日期，设置为当前日期
      settings.value.startDate = today
      return
    }

    // 验证现有日期
    if (!DateUtils.isValidDateString(settings.value.startDate)) {
      settings.value.startDate = today
      return
    }

    // 检查是否为过去的日期
    const selectedDate = DateUtils.parseDate(settings.value.startDate)
    const todayDate = DateUtils.parseDate(today)

    if (selectedDate < todayDate) {
      settings.value.startDate = today
    }
  } catch (error) {
    handleValidationError('初始化起始日期失败', { error, startDate: settings.value.startDate })
    settings.value.startDate = DateUtils.today()
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

/* 周末跳过开关样式 */
:deep(.el-form-item--default .el-form-item__content) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.form-switch {
  margin: 0;
  align-self: flex-start;
}

.weekend-info {
  width: 100%;
  margin: 0;
}

.weekend-alert {
  margin-bottom: 0;
  width: 100%;
}

:deep(.weekend-alert .el-alert__title) {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-color-info-dark-2);
}

:deep(.el-switch__label) {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-switch.is-checked .el-switch__label) {
  color: var(--el-color-primary);
}

/* 活跃状态下的开关样式 */
:deep(.el-switch.is-checked) {
  transform: scale(1.02);
  transition: transform 0.2s ease;
}

/* 信息提示动画效果 */
.weekend-alert {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>