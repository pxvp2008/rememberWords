/**
 * Excel数据处理相关的严格类型定义
 */

// Excel行数据的通用接口
export interface ExcelRowData extends Record<string, string | number | boolean> {
  [key: string]: string | number | boolean
}

// 解析后的Excel行数据接口
export interface ParsedExcelRow {
  word: string
  meaning: string
  [key: string]: string | number | boolean
}

// 导出学习计划的Excel数据格式
export interface StudyPlanExportData {
  '日期': string
  '今日新背': string
  '今日复习': string
}

export interface DailyTaskExportData {
  '日期': string
  '任务类型': '新学' | '复习'
  '单词': string
  '释义': string
}

export interface PlanOverviewData {
  '项目': string
  '数值': string | number
}

// ECharts图表数据类型
export interface ChartSeriesData {
  name: string
  type: 'bar' | 'line'
  stack?: string
  data: number[]
  itemStyle?: {
    color?: string
  }
  lineStyle?: {
    width?: number
  }
}

export interface ChartTooltipParams {
  axisValue: string
  marker: string
  seriesName: string
  value: number
}