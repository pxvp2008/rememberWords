import { ref, computed } from 'vue'
import type { Word, StudySettings, DailyTask, StudyPlan } from '@/types'
import { EBBINGHAUS_INTERVALS } from '@/types'

/**
 * 艾宾浩斯遗忘曲线算法组合式函数
 *
 * 基于1、2、4、7、15天的复习间隔，为用户生成科学的学习计划。
 * 算法特点：
 * - 智能负载均衡，避免学习负担过重
 * - 优先级排序，紧急复习任务优先安排
 * - 动态调整，根据用户参数个性化生成
 *
 * @returns 艾宾浩斯算法相关的状态和方法
 */
export function useEbbinghaus() {
  /** 当前生成的学习计划 */
  const plan = ref<StudyPlan | null>(null)
  /** 是否正在生成计划的加载状态 */
  const isGenerating = ref(false)

  /**
   * 日期工具函数：添加指定天数到给定日期
   *
   * @param date 基础日期
   * @param days 要添加的天数
   * @returns 计算后的新日期
   */
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  /**
   * 日期工具函数：格式化日期为YYYY-MM-DD字符串
   *
   * @param date 要格式化的日期
   * @returns 格式化后的日期字符串
   */
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  /**
   * 核心算法：生成基于艾宾浩斯遗忘曲线的学习计划
   *
   * 算法流程：
   * 1. 按每日新学数量顺序分配单词
   * 2. 为每个新单词安排5个复习时间点（1、2、4、7、15天后）
   * 3. 将复习任务加入队列，按日期排序
   * 4. 每天优先处理复习任务，再安排新学任务
   * 5. 确保每日学习量不超过设定的最大值
   *
   * @param words 要学习的单词列表
   * @param settings 用户设置的学习参数
   * @returns 生成的完整学习计划
   */
  const generatePlan = (words: Word[], settings: StudySettings): StudyPlan => {
    console.log('🎯 开始生成艾宾浩斯学习计划')
    console.log(`📊 输入参数: 单词数=${words.length}, 每日新学=${settings.dailyNew}, 每日最大复习=${settings.maxReview}`)
    console.log(`📅 起始日期: ${settings.startDate}`)
    console.log(`🔄 艾宾浩斯间隔: [${EBBINGHAUS_INTERVALS.join(', ')}]天`)

    const tasks: DailyTask[] = []
    /** 复习任务队列，存储所有待复习的单词 */
    const reviewQueue: Array<{ word: Word; reviewDate: string; reviewCount: number }> = []

    let wordIndex = 0

    // 为主周期的每一天生成学习任务
    for (let day = 0; day < settings.period; day++) {
      const currentDate = addDays(settings.startDate, day)
      const dateString = formatDate(currentDate)

      const newWords: Word[] = []
      const reviewWords: Word[] = []

      // === 步骤1：分配新学单词 ===
      const newWordsCount = Math.min(settings.dailyNew, words.length - wordIndex)
      for (let i = 0; i < newWordsCount; i++) {
        if (wordIndex < words.length) {
          const word = words[wordIndex]
          newWords.push(word)
          wordIndex++

          // === 步骤2：为新单词安排复习任务 ===
          // 基于艾宾浩斯遗忘曲线的5个关键时间点（1、2、4、7、15天后）
          // 每个复习时间点都从学习日开始计算，这是正确的艾宾浩斯实现
          const reviewDates: string[] = []
          for (const interval of EBBINGHAUS_INTERVALS) {
            const reviewDate = addDays(currentDate, interval)
            const reviewDateStr = formatDate(reviewDate)
            reviewQueue.push({
              word,
              reviewDate: reviewDateStr,
              reviewCount: EBBINGHAUS_INTERVALS.indexOf(interval) + 1
            })
            reviewDates.push(reviewDateStr)
          }

          // 调试：显示每个新单词的复习安排
          if (wordIndex <= 5) { // 只显示前5个单词，避免日志过多
            console.log(`📖 第${wordIndex}个单词 "${word.word}" 的复习安排:`)
            console.log(`   学习日期: ${dateString}`)
            console.log(`   复习日期: [${reviewDates.join(', ')}]`)
            console.log(`   间隔天数: [${EBBINGHAUS_INTERVALS.join(', ')}]`)
          }
        }
      }

      // === 步骤3：处理当天的复习任务 ===
      const todayReviews = reviewQueue.filter(item => item.reviewDate === dateString)
      const reviewCount = Math.min(todayReviews.length, settings.maxReview)

      // 按紧急程度排序：复习次数少的优先（越早学习的单词越需要及时复习）
      todayReviews.sort((a, b) => a.reviewCount - b.reviewCount)

      // 安排复习任务
      for (let i = 0; i < reviewCount; i++) {
        reviewWords.push(todayReviews[i].word)
        // 安全移除已安排的复习任务
        const index = reviewQueue.indexOf(todayReviews[i])
        if (index > -1) {
          reviewQueue.splice(index, 1)
        }
      }

      // 如果当天的复习任务超过了最大复习量，将剩余的复习任务延迟到下一天
      if (todayReviews.length > settings.maxReview) {
        const nextDate = formatDate(addDays(currentDate, 1))
        for (let i = settings.maxReview; i < todayReviews.length; i++) {
          reviewQueue.push({
            ...todayReviews[i],
            reviewDate: nextDate
          })
        }
      }

      // 保存当天的学习任务
      tasks.push({
        date: dateString,
        newWords,
        reviewWords
      })

      // 调试：显示每天的学习任务摘要
      const totalTasks = newWords.length + reviewWords.length
      if (totalTasks > 0 || day < 10) { // 前10天或有任何任务的日期都显示
        console.log(`📅 第${day + 1}天 (${dateString}):`)
        console.log(`   新学单词: ${newWords.length}个 ${newWords.map(w => w.word).join(', ')}`)
        console.log(`   复习单词: ${reviewWords.length}个 ${reviewWords.map(w => w.word).join(', ')}`)
        console.log(`   总任务: ${totalTasks}个`)
        console.log(`   复习队列剩余: ${reviewQueue.length}个`)
      }

      // 优化：如果所有单词都已学习完成且没有待复习任务，可以提前结束
      if (wordIndex >= words.length && reviewQueue.length === 0) {
        console.log(`✅ 学习计划完成: 总共${day + 1}天`)
        break
      }
    }

    // 生成完成后的统计信息
    const totalDays = tasks.length
    const totalNewWords = words.length
    const totalReviewTasks = tasks.reduce((sum, task) => sum + task.reviewWords.length, 0)
    const totalStudyTasks = tasks.reduce((sum, task) => sum + task.newWords.length + task.reviewWords.length, 0)

    console.log('📊 学习计划生成完成统计:')
    console.log(`   总天数: ${totalDays}天`)
    console.log(`   总单词数: ${totalNewWords}个`)
    console.log(`   总复习任务: ${totalReviewTasks}个`)
    console.log(`   总学习任务: ${totalStudyTasks}个`)
    console.log(`   平均每日任务: ${(totalStudyTasks / totalDays).toFixed(1)}个`)

    // 验证艾宾浩斯间隔是否正确
    const expectedReviews = totalNewWords * EBBINGHAUS_INTERVALS.length
    console.log(`✅ 艾宾浩斯验证: 期望复习次数=${expectedReviews}, 实际安排=${totalReviewTasks}`)
    if (totalReviewTasks === expectedReviews) {
      console.log(`   🎉 复习安排完全正确!`)
    } else {
      console.log(`   ⚠️  复习安排可能有遗漏或重复`)
    }

    return {
      settings,
      tasks,
      originalWords: words
    }
  }

  /**
   * 计算学习计划的统计信息
   * 为数据可视化提供支持数据
   */
  const planStats = computed(() => {
    if (!plan.value) return null

    const totalDays = plan.value.tasks.length
    const totalNewWords = plan.value.originalWords.length
    const totalReviews = plan.value.tasks.reduce((sum, task) => sum + task.reviewWords.length, 0)
    const totalStudyTasks = plan.value.tasks.reduce((sum, task) => sum + task.newWords.length + task.reviewWords.length, 0)

    // 每日详细统计数据，用于图表展示
    const dailyStats = plan.value.tasks.map(task => ({
      date: task.date,
      newCount: task.newWords.length,
      reviewCount: task.reviewWords.length,
      totalCount: task.newWords.length + task.reviewWords.length
    }))

    return {
      totalDays,
      totalNewWords,
      totalReviews,
      totalStudyTasks,
      dailyStats,
      averageDailyLoad: Math.round(totalStudyTasks / totalDays * 10) / 10
    }
  })

  /**
   * 异步生成学习计划
   * 提供加载状态和错误处理
   *
   * @param words 单词列表
   * @param settings 学习设置
   */
  const generateStudyPlan = async (words: Word[], settings: StudySettings) => {
    isGenerating.value = true
    try {
      // 短暂延迟以提供更好的用户体验，避免UI阻塞
      await new Promise(resolve => setTimeout(resolve, 100))
      plan.value = generatePlan(words, settings)
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * 清除当前的学习计划
   */
  const clearPlan = () => {
    plan.value = null
  }

  return {
    plan,
    isGenerating,
    planStats,
    generateStudyPlan,
    clearPlan
  }
}