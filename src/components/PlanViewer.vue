<template>
  <div class="plan-viewer">
    <!-- 计划统计 -->
    <el-card class="stats-card">
      <template #header>
        <div class="card-header">
          <el-icon><DataAnalysis /></el-icon>
          <span>学习计划统计</span>
        </div>
      </template>

      <!-- 生成中状态 -->
      <div v-if="isGenerating" class="generating-state">
        <el-empty description="正在生成学习计划...">
          <el-progress type="circle" :percentage="50" status="success" />
        </el-empty>
      </div>

      <!-- 统计信息 -->
      <div v-else-if="hasPlanData">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="学习周期" :value="planStats?.totalDays || 0" suffix="天" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="总单词数" :value="planStats?.totalNewWords || 0" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="总复习次数" :value="planStats?.totalReviews || 0" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="平均每日" :value="planStats?.averageDailyLoad || 0" />
          </el-col>
        </el-row>

        <!-- 学习负荷分布图 -->
        <div class="chart-container" v-if="planStats">
          <h4>学习负荷分布</h4>
          <div ref="chartRef" class="load-chart"></div>
        </div>
      </div>

      <!-- 无计划提示 -->
      <el-empty v-else description="暂无学习计划" />
    </el-card>

    <!-- 视图切换 -->
    <el-card class="view-card">
      <template #header>
        <div class="card-header">
          <el-icon><Calendar /></el-icon>
          <span>学习计划详情</span>
          <div class="view-controls">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="calendar">日历视图</el-radio-button>
              <el-radio-button label="list">列表视图</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- 日历视图 -->
      <div v-if="viewMode === 'calendar'" class="calendar-view">
        <el-calendar v-model="currentDate">
          <template #date-cell="{ data }">
            <div class="calendar-day">
              <div class="day-number">{{ data.day.split('-')[2] }}</div>
              <div v-if="getDayTask(data.day)" class="day-tasks">
                <el-tag size="small" type="primary" v-if="getDayTask(data.day).newWords.length > 0">
                  新学 {{ getDayTask(data.day).newWords.length }}
                </el-tag>
                <el-tag size="small" type="warning" v-if="getDayTask(data.day).reviewWords.length > 0">
                  复习 {{ getDayTask(data.day).reviewWords.length }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-calendar>
      </div>

      <!-- 列表视图 -->
      <div v-else class="list-view">
        <el-table
          :data="planTasks"
          style="width: 100%"
          :default-sort="{ prop: 'date', order: 'ascending' }"
        >
          <el-table-column prop="date" label="日期" width="120" sortable>
            <template #default="{ row }">
              <div class="date-cell">
                <div>{{ formatDate(row.date) }}</div>
                <div class="weekday">{{ getWeekday(row.date) }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="新学单词" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.newWords && row.newWords.length > 0" type="primary" size="small">
                {{ row.newWords.length }} 个
              </el-tag>
              <span v-else class="no-task">-</span>
            </template>
          </el-table-column>

          <el-table-column label="复习单词" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.reviewWords && row.reviewWords.length > 0" type="warning" size="small">
                {{ row.reviewWords.length }} 个
              </el-tag>
              <span v-else class="no-task">-</span>
            </template>
          </el-table-column>

          <el-table-column label="总计" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getTotalCountType((row.newWords?.length || 0) + (row.reviewWords?.length || 0))"
                size="small"
              >
                {{ (row.newWords?.length || 0) + (row.reviewWords?.length || 0) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button
                type="text"
                size="small"
                @click="showDayDetail(row)"
                :disabled="(!row.newWords || row.newWords.length === 0) && (!row.reviewWords || row.reviewWords.length === 0)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 每日详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`每日任务详情 - ${formatDate(selectedTask?.date || '')}`"
      width="800px"
    >
      <div v-if="selectedTask" class="task-detail">
        <el-tabs v-model="activeTab">
          <el-tab-pane
            label="新学单词"
            :name="'new'"
            v-if="selectedTask.newWords.length > 0"
          >
            <el-table :data="selectedTask.newWords" style="width: 100%">
              <el-table-column type="index" label="序号" width="60" />
              <el-table-column prop="word" label="单词" width="200" />
              <el-table-column prop="meaning" label="释义" />
            </el-table>
          </el-tab-pane>

          <el-tab-pane
            label="复习单词"
            :name="'review'"
            v-if="selectedTask.reviewWords.length > 0"
          >
            <el-table :data="selectedTask.reviewWords" style="width: 100%">
              <el-table-column type="index" label="序号" width="60" />
              <el-table-column prop="word" label="单词" width="200" />
              <el-table-column prop="meaning" label="释义" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="goBack">返回</el-button>
      <el-button @click="regeneratePlan">重新生成</el-button>
      <el-button type="primary" @click="exportPlan">导出计划</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Calendar } from '@element-plus/icons-vue'
import { useStorage } from '@/composables/useStorage'
import { useExcel } from '@/composables/useExcel'
import { useEbbinghaus } from '@/composables/useEbbinghaus'
import type { DailyTask } from '@/types'
import type { ChartTooltipParams } from '@/types/excel'
import * as echarts from 'echarts'

const emit = defineEmits<{
  back: []
  regenerate: []
}>()

const { words, settings } = useStorage()
const { exportStudyPlan } = useExcel()
const { generateStudyPlan, plan, planStats, isGenerating } = useEbbinghaus()

// 安全获取数据
const safePlan = computed(() => plan.value || null)
const safeWords = computed(() => words.value || [])
const safeSettings = computed(() => settings.value || null)

// 检查是否有计划数据
const hasPlanData = computed(() => {
  return !!(planStats.value && planStats.value.totalDays > 0)
})

// 获取计划任务列表
const planTasks = computed(() => {
  return safePlan.value?.tasks || []
})

const viewMode = ref<'calendar' | 'list'>('list')
const currentDate = ref(new Date())
const detailDialogVisible = ref(false)
const selectedTask = ref<DailyTask | null>(null)
const activeTab = ref('new')
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 获取指定日期的任务
const getDayTask = (date: string): DailyTask | undefined => {
  return safePlan.value?.tasks.find(task => task.date === date)
}

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 获取星期几
const getWeekday = (dateString: string): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const date = new Date(dateString)
  return weekdays[date.getDay()]
}

// 获取总数对应的标签类型
const getTotalCountType = (count: number): string => {
  if (count === 0) return 'info'
  if (count <= 20) return 'success'
  if (count <= 50) return 'warning'
  return 'danger'
}

// 显示每日详情
const showDayDetail = (task: DailyTask) => {
  selectedTask.value = task
  if (task.newWords.length > 0) {
    activeTab.value = 'new'
  } else {
    activeTab.value = 'review'
  }
  detailDialogVisible.value = true
}

// 绘制学习负荷图
const drawLoadChart = () => {
  if (!chartRef.value || !planStats.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const option = {
    title: {
      text: '每日学习负荷',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: ChartTooltipParams[]) {
        let result = params[0].axisValue + '<br/>'
        params.forEach((item: ChartTooltipParams) => {
          result += `${item.marker}${item.seriesName}: ${item.value}个<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['新学单词', '复习单词', '总计'],
      top: 35,
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '30%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: planStats.value.dailyStats.map(item => formatDate(item.date)),
      axisLabel: {
        interval: Math.floor(planStats.value.dailyStats.length / 10)
      }
    },
    yAxis: {
      type: 'value',
      name: '单词数'
    },
    series: [
      {
        name: '新学单词',
        type: 'bar',
        stack: 'total',
        data: planStats.value.dailyStats.map(item => item.newCount),
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '复习单词',
        type: 'bar',
        stack: 'total',
        data: planStats.value.dailyStats.map(item => item.reviewCount),
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '总计',
        type: 'line',
        data: planStats.value.dailyStats.map(item => item.totalCount),
        itemStyle: {
          color: '#67C23A'
        },
        lineStyle: {
          width: 2
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

// 返回
const goBack = () => {
  emit('back')
}

// 重新生成计划
const regeneratePlan = () => {
  emit('regenerate')
}

// 自动生成计划
const autoGeneratePlan = async () => {
  console.log('autoGeneratePlan called', {
    hasPlan: !!safePlan.value,
    planFromEbbinghaus: !!plan.value,
    wordsLength: safeWords.value?.length,
    hasSettings: !!safeSettings.value,
    planStats: !!planStats.value
  })

  if (!plan.value && safeWords.value && safeWords.value.length > 0 && safeSettings.value) {
    console.log('Starting auto generation...')
    try {
      await generateStudyPlan(safeWords.value, safeSettings.value)
      console.log('Plan generated successfully', {
        plan: !!plan.value,
        planTasks: plan.value?.tasks?.length,
        planStats: !!planStats.value
      })
      // 不在这里显示成功消息，由generateStudyPlan的调用者处理
    } catch (error) {
      console.error('自动生成计划失败:', error)
      ElMessage.error('计划生成失败，请重新生成')
    }
  } else {
    console.log('Auto generation conditions not met, plan already exists')
  }
}

// 导出计划
const exportPlan = () => {
  if (safePlan.value) {
    const success = exportStudyPlan(safePlan.value)
    if (success) {
      ElMessage.success('学习计划导出成功')
    } else {
      ElMessage.error('导出失败，请重试')
    }
  }
}

// 监听窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听计划变化，自动生成
watch([safePlan, safeWords, safeSettings], () => {
  if (!safePlan.value && safeWords.value && safeWords.value.length > 0 && safeSettings.value) {
    console.log('Watch triggered - attempting auto generation')
    autoGeneratePlan()
  }

  // 如果数据被清除，重置组件状态
  if (safeWords.value.length === 0) {
    selectedTask.value = null
    detailDialogVisible.value = false
    activeTab.value = 'new'
    viewMode.value = 'list'
    currentDate.value = new Date()

    // 清除图表
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
  }
})

// 监听计划生成完成，重新绘制图表
watch(planStats, (newStats) => {
  if (newStats) {
    console.log('Plan stats updated, redrawing chart')
    nextTick(() => {
      drawLoadChart()
    })
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    console.log('PlanViewer mounted, checking auto generation')
    // 检查是否需要自动生成
    if (!safePlan.value && safeWords.value && safeWords.value.length > 0 && safeSettings.value) {
      autoGeneratePlan()
    } else {
      // 如果已经有计划或者数据不完整，也要尝试绘制图表
      drawLoadChart()
    }
    window.addEventListener('resize', handleResize)
  })
})

// 清理内存和事件监听器
onUnmounted(() => {
  // 清理 ECharts 实例
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }

  // 移除事件监听器
  window.removeEventListener('resize', handleResize)

  console.log('PlanViewer unmounted, resources cleaned up')
})
</script>

<style scoped>
.plan-viewer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.stats-card,
.view-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  justify-content: space-between;
}

.view-controls {
  margin-left: auto;
}

.chart-container {
  margin-top: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.chart-container h4 {
  margin: 0 0 20px 0;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.load-chart {
  width: 100%;
  height: 300px;
}

.calendar-view {
  min-height: 500px;
}

.calendar-day {
  height: 60px;
  padding: 4px;
  display: flex;
  flex-direction: column;
}

.day-number {
  font-weight: bold;
  margin-bottom: 4px;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-tasks .el-tag {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
}

.list-view {
  margin-top: 20px;
}

.date-cell {
  line-height: 1.4;
}

.weekday {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.no-task {
  color: var(--el-text-color-placeholder);
}

.task-detail {
  max-height: 500px;
  overflow-y: auto;
}

.generating-state {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  padding: 30px 0;
  border-top: 2px solid var(--el-border-color-light);
}

.action-buttons .el-button {
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.action-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

:deep(.el-calendar__body) {
  padding: 8px;
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 80px;
}

:deep(.el-calendar-day) {
  height: auto !important;
  min-height: 80px;
}

:deep(.el-statistic__head) {
  margin-bottom: 8px;
}

:deep(.el-statistic__content) {
  font-size: 24px;
  font-weight: bold;
}
</style>