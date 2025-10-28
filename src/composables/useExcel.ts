import { ref } from 'vue'
import * as XLSX from 'xlsx'
import type { Word, ExcelImportResult } from '@/types'
import type {
  ExcelRowData,
  ParsedExcelRow,
  StudyPlanExportData,
  DailyTaskExportData,
  PlanOverviewData,
  ChartTooltipParams
} from '@/types/excel'
import {
  sanitizeInput,
  validateExcelRow,
  validateFile,
  generateSafeId,
  MAX_EXCEL_ROWS
} from '@/utils/sanitize'

export function useExcel() {
  const isImporting = ref(false)
  const importProgress = ref(0)

  // 验证Excel文件结构
  const validateExcelStructure = (worksheet: XLSX.WorkSheet): boolean => {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

    // 检查是否有足够的列
    if (range.e.c < 1) {
      return false
    }

    // 检查表头
    const firstRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[]
    if (!firstRow || firstRow.length < 2) {
      return false
    }

    // 检查表头是否包含预期的字段
    const headers = firstRow.map(h => h?.toLowerCase().trim() || '')
    const hasWordColumn = headers.some(h => h.includes('单词') || h.includes('word') || h.includes('词汇'))
    const hasMeaningColumn = headers.some(h => h.includes('释义') || h.includes('meaning') || h.includes('翻译') || h.includes('解释'))

    return hasWordColumn && hasMeaningColumn
  }

  // 解析Excel文件
  const parseExcelFile = async (file: File): Promise<ExcelImportResult> => {
    isImporting.value = true
    importProgress.value = 0

    try {
      // 验证文件
      const fileValidation = validateFile(file)
      if (!fileValidation.isValid) {
        return {
          success: false,
          error: fileValidation.error
        }
      }

      importProgress.value = 20

      // 读取文件
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      importProgress.value = 40

      // 获取第一个工作表
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      // 验证工作表结构
      if (!validateExcelStructure(worksheet)) {
        return {
          success: false,
          error: 'Excel文件结构不正确。请确保文件包含两列：单词和释义（必须包含表头）'
        }
      }

      importProgress.value = 60

      // 解析数据
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[]
      const words: Word[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]

        // 使用新的验证函数
        const validation = validateExcelRow(row)

        if (validation.isValid && validation.word && validation.meaning) {
          words.push({
            id: generateSafeId('word', i),
            word: validation.word,
            meaning: validation.meaning
          })
        } else if (validation.error) {
          console.warn(`第 ${i + 1} 行数据验证失败: ${validation.error}`)
        }

        importProgress.value = 60 + (i / jsonData.length) * 30
      }

      importProgress.value = 90

      // 验证数据
      if (words.length === 0) {
        return {
          success: false,
          error: '未找到有效的单词数据'
        }
      }

      if (words.length > MAX_EXCEL_ROWS) {
        return {
          success: false,
          error: `数据量过大，请控制在${MAX_EXCEL_ROWS}条记录以内`
        }
      }

      importProgress.value = 100

      return {
        success: true,
        words
      }

    } catch (error) {
      console.error('Excel解析错误:', error)
      return {
        success: false,
        error: '文件解析失败，请检查文件是否损坏或格式是否正确'
      }
    } finally {
      isImporting.value = false
      importProgress.value = 0
    }
  }

  // 导出Excel文件
  const exportToExcel = (data: ExcelRowData[], filename: string) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

      // 下载文件
      XLSX.writeFile(workbook, `${filename}.xlsx`)
      return true
    } catch (error) {
      console.error('Excel导出错误:', error)
      return false
    }
  }

  // 导出学习计划为Excel
  const exportStudyPlan = (plan: StudyPlan) => {
    try {
      const workbook = XLSX.utils.book_new()

      // 工作表1：学习计划总览
      const overviewData: PlanOverviewData[] = [
        { '项目': '学习周期(天)', '数值': plan.settings.period },
        { '项目': '每日新学单词数', '数值': plan.settings.dailyNew },
        { '项目': '每日最大复习数', '数值': plan.settings.maxReview },
        { '项目': '起始日期', '数值': plan.settings.startDate },
        { '项目': '总单词数', '数值': plan.originalWords.length },
        { '项目': '计划天数', '数值': plan.tasks.length }
      ]
      const overviewSheet = XLSX.utils.json_to_sheet(overviewData)
      XLSX.utils.book_append_sheet(workbook, overviewSheet, '计划总览')

      // 工作表2：每日任务汇总（日期、今日新背、今日复习）
      const dailySummaryData: StudyPlanExportData[] = plan.tasks.map((task) => {
        // 格式化新学单词列表（包含释义）
        const newWordsText = task.newWords.map((word: Word) => `${word.word}(${word.meaning})`).join(', ')
        // 格式化复习单词列表（包含释义）
        const reviewWordsText = task.reviewWords.map((word: Word) => `${word.word}(${word.meaning})`).join(', ')

        return {
          '日期': formatDateForExport(task.date),
          '今日新背': newWordsText || '无',
          '今日复习': reviewWordsText || '无'
        }
      })
      const dailySummarySheet = XLSX.utils.json_to_sheet(dailySummaryData)
      XLSX.utils.book_append_sheet(workbook, dailySummarySheet, '每日任务汇总')

      // 工作表3：每日详细任务
      const dailyTasksData: DailyTaskExportData[] = plan.tasks.flatMap((task) => [
        ...task.newWords.map((word: Word) => ({
          '日期': formatDateForExport(task.date),
          '任务类型': '新学' as const,
          '单词': word.word,
          '释义': word.meaning
        })),
        ...task.reviewWords.map((word: Word) => ({
          '日期': formatDateForExport(task.date),
          '任务类型': '复习' as const,
          '单词': word.word,
          '释义': word.meaning
        }))
      ])
      const dailyTasksSheet = XLSX.utils.json_to_sheet(dailyTasksData)
      XLSX.utils.book_append_sheet(workbook, dailyTasksSheet, '每日任务详情')

      // 工作表4：原始单词库
      const originalWordsSheet = XLSX.utils.json_to_sheet(plan.originalWords)
      XLSX.utils.book_append_sheet(workbook, originalWordsSheet, '原始单词库')

      // 下载文件
      const today = new Date().toISOString().split('T')[0]
      XLSX.writeFile(workbook, `学习计划_${today}.xlsx`)
      return true
    } catch (error) {
      console.error('学习计划导出错误:', error)
      return false
    }
  }

  // 格式化日期用于导出
  const formatDateForExport = (dateString: string): string => {
    const date = new Date(dateString)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  return {
    isImporting,
    importProgress,
    parseExcelFile,
    exportToExcel,
    exportStudyPlan
  }
}