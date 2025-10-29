import { ref, computed } from 'vue'
import type { Word, StudySettings, DailyTask, StudyPlan } from '@/types'
import { EBBINGHAUS_INTERVALS, DateUtils } from '@/types'
import { logger } from '@/utils/logger'

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

  // 使用统一的DateUtils进行日期处理

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
    logger.log('🎯 开始生成艾宾浩斯学习计划')
    logger.log(`📊 输入参数: 单词数=${words.length}, 每日新学=${settings.dailyNew}, 每日最大复习=${settings.maxReview}`)
    logger.log(`📅 起始日期: ${settings.startDate}`)
    logger.log(`🔄 艾宾浩斯间隔: [${EBBINGHAUS_INTERVALS.join(', ')}]天`)
    logger.log(`🚫 跳过周末: ${settings.skipWeekends ? '是' : '否'}`)

    const tasks: DailyTask[] = []
    /** 复习任务队列，存储所有待复习的单词 */
    let reviewQueue: Array<{ word: Word; reviewDate: string; reviewCount: number }> = []

    let wordIndex = 0

    if (settings.skipWeekends) {
      // === 跳过周末的模式 ===
      logger.log('📆 使用跳过周末模式：只在工作日（周一至周五）安排学习')

      // 按照原始算法逻辑，只是日期跳过周末
      let dayIndex = 0
      let actualCalendarDay = 0
      const MAX_DAYS = 730 // 安全限制，最多730天（2年）

      while (wordIndex < words.length || reviewQueue.length > 0) {
        // 安全限制：防止无限循环
        if (actualCalendarDay > MAX_DAYS) {
          logger.error('⚠️ 学习计划生成超时，强制终止')
          break
        }

        // 计算实际日期，跳过周末
        let dateString = DateUtils.addDays(settings.startDate, actualCalendarDay)

        // 如果是周末，跳过但不增加dayIndex（学习日计数器）
        if (DateUtils.isWeekend(dateString)) {
          logger.log(`🔄 跳过周末: ${dateString} (${DateUtils.getDayName(dateString)})`)
          actualCalendarDay++
          continue
        }

        dayIndex++ // 只有非周末才计入学习日

        const newWords: Word[] = []
        const reviewWords: Word[] = []

        logger.log(`📅 学习日 ${dayIndex}: ${dateString} (${DateUtils.getDayName(dateString)})`)

        // === 步骤1：分配新学单词 ===
        const newWordsCount = Math.min(settings.dailyNew, words.length - wordIndex)
        for (let i = 0; i < newWordsCount; i++) {
          if (wordIndex < words.length) {
            const word = words[wordIndex]
            newWords.push(word)
            wordIndex++

            // === 步骤2：为新单词安排复习任务 ===
            // 复习间隔按照自然日计算，但在跳过周末模式下需要转换为工作日
            const reviewDates: string[] = []
            for (const interval of EBBINGHAUS_INTERVALS) {
              // 先按自然日计算复习日期
              let reviewDateStr = DateUtils.addDays(dateString, interval)

              // 如果复习日期是周末，顺延到下一个工作日
              while (DateUtils.isWeekend(reviewDateStr)) {
                reviewDateStr = DateUtils.addDays(reviewDateStr, 1)
              }

              reviewQueue.push({
                word,
                reviewDate: reviewDateStr,
                reviewCount: EBBINGHAUS_INTERVALS.indexOf(interval) + 1
              })
              reviewDates.push(reviewDateStr)
            }

            // 调试：显示每个新单词的复习安排
            if (wordIndex <= 5) {
              logger.log(`📖 第${wordIndex}个单词 "${word.word}" 的复习安排:`)
              logger.log(`   学习日期: ${dateString} (${DateUtils.getDayName(dateString)})`)
              logger.log(`   复习日期: [${reviewDates.join(', ')}]`)
              logger.log(`   间隔天数: [${EBBINGHAUS_INTERVALS.join(', ')}]天`)
            }
          }
        }

        // === 步骤3：处理当天的复习任务 ===
        const todayReviews = reviewQueue.filter(item => item.reviewDate === dateString)
        const reviewCount = Math.min(todayReviews.length, settings.maxReview)

        // 按紧急程度排序：复习次数少的优先
        todayReviews.sort((a, b) => a.reviewCount - b.reviewCount)

        // 安排复习任务，并从队列中移除
        // 使用更可靠的移除方法：直接从filter结果中取前reviewCount个
        const todayReviewsSorted = todayReviews.sort((a, b) => a.reviewCount - b.reviewCount)
        for (let i = 0; i < Math.min(reviewCount, todayReviewsSorted.length); i++) {
          const reviewItem = todayReviewsSorted[i]
          reviewWords.push(reviewItem.word)
        }

        // 处理复习任务的延期
        if (todayReviewsSorted.length > reviewCount) {
          const remainingReviews = todayReviewsSorted.slice(reviewCount)

          // 从队列中移除已安排的复习任务
          reviewQueue = reviewQueue.filter(item => item.reviewDate !== dateString)

          // 将剩余的复习任务延期到下一天/下一个工作日
          let nextDate = DateUtils.addDays(dateString, 1)

          // 在跳过周末模式下，找到下一个工作日
          if (settings.skipWeekends) {
            while (DateUtils.isWeekend(nextDate)) {
              nextDate = DateUtils.addDays(nextDate, 1)
            }
          }

          for (const reviewItem of remainingReviews) {
            reviewQueue.push({
              word: reviewItem.word,
              reviewDate: nextDate,
              reviewCount: reviewItem.reviewCount
            })
          }
          logger.log(`⏰ 复习任务超负荷，${remainingReviews.length}个任务延期至 ${nextDate}`)
        } else {
          // 如果没有延期，直接从队列中移除已安排的复习任务
          reviewQueue = reviewQueue.filter(item => item.reviewDate !== dateString)
        }

  
        // 调试：显示每天的学习任务摘要
        const totalTasks = newWords.length + reviewWords.length

        // 只有当天的学习任务不为空时才保存
        if (newWords.length > 0 || reviewWords.length > 0) {
          tasks.push({
            date: dateString,
            newWords,
            reviewWords
          })

          logger.log(`📅 ${dateString} (${DateUtils.getDayName(dateString)}):`)
          logger.log(`   新学单词: ${newWords.length}个 ${newWords.map(w => w.word).join(', ')}`)
          logger.log(`   复习单词: ${reviewWords.length}个 ${reviewWords.map(w => w.word).join(', ')}`)
          logger.log(`   总任务: ${totalTasks}个`)
        } else {
          logger.log(`⚭ 跳过空日期: ${dateString} (无学习任务)`)
        }

        logger.log(`   复习队列剩余: ${reviewQueue.length}个`)

        // 调试：检查算法退出条件
        if (wordIndex >= words.length && reviewQueue.length === 0) {
          logger.log(`🎯 算法正常退出: 所有单词已学完且复习队列为空`)
        }

        actualCalendarDay++
      }

      logger.log(`✅ 跳过周末模式完成: 总共${dayIndex}个学习日，日历跨度${actualCalendarDay}天`)

      // 调试：检查未完成的复习任务
      if (reviewQueue.length > 0) {
        logger.log(`⚠️ 警告: 仍有 ${reviewQueue.length} 个复习任务未安排`)
        logger.log(`   未安排任务的日期范围: ${reviewQueue.map(item => item.reviewDate).slice(0, 5).join(', ')}...`)
      }
    } else {
      // === 传统模式：包含所有日期 ===
      logger.log('📆 使用传统模式：包含所有日期（周一至周日）')

      // 按照原始算法逻辑，包含所有日期
      let dayIndex = 0
      const MAX_DAYS = 730 // 安全限制，最多730天（2年）

      while (wordIndex < words.length || reviewQueue.length > 0) {
        // 安全限制：防止无限循环
        if (dayIndex > MAX_DAYS) {
          logger.error('⚠️ 学习计划生成超时，强制终止')
          break
        }

        const dateString = DateUtils.addDays(settings.startDate, dayIndex)
        dayIndex++

        const newWords: Word[] = []
        const reviewWords: Word[] = []

        logger.log(`📅 第${dayIndex}天: ${dateString} (${DateUtils.getDayName(dateString)})`)

        // === 步骤1：分配新学单词 ===
        const newWordsCount = Math.min(settings.dailyNew, words.length - wordIndex)
        for (let i = 0; i < newWordsCount; i++) {
          if (wordIndex < words.length) {
            const word = words[wordIndex]
            newWords.push(word)
            wordIndex++

            // === 步骤2：为新单词安排复习任务 ===
            // 基于艾宾浩斯遗忘曲线的5个关键时间点（1、2、4、7、15天后）
            const reviewDates: string[] = []
            for (const interval of EBBINGHAUS_INTERVALS) {
              const reviewDateStr = DateUtils.addDays(dateString, interval)
              reviewQueue.push({
                word,
                reviewDate: reviewDateStr,
                reviewCount: EBBINGHAUS_INTERVALS.indexOf(interval) + 1
              })
              reviewDates.push(reviewDateStr)
            }

            // 调试：显示每个新单词的复习安排
            if (wordIndex <= 5) {
              logger.log(`📖 第${wordIndex}个单词 "${word.word}" 的复习安排:`)
              logger.log(`   学习日期: ${dateString} (${DateUtils.getDayName(dateString)})`)
              logger.log(`   复习日期: [${reviewDates.join(', ')}]`)
              logger.log(`   间隔天数: [${EBBINGHAUS_INTERVALS.join(', ')}]天`)
            }
          }
        }

        // === 步骤3：处理当天的复习任务 ===
        const todayReviews = reviewQueue.filter(item => item.reviewDate === dateString)
        const reviewCount = Math.min(todayReviews.length, settings.maxReview)

        // 按紧急程度排序：复习次数少的优先
        todayReviews.sort((a, b) => a.reviewCount - b.reviewCount)

        // 安排复习任务，并从队列中移除
        // 使用更可靠的移除方法：直接从filter结果中取前reviewCount个
        const todayReviewsSorted = todayReviews.sort((a, b) => a.reviewCount - b.reviewCount)
        for (let i = 0; i < Math.min(reviewCount, todayReviewsSorted.length); i++) {
          const reviewItem = todayReviewsSorted[i]
          reviewWords.push(reviewItem.word)
        }

        // 从队列中移除已安排的复习任务
        const remainingReviews = todayReviewsSorted.slice(reviewCount)
        reviewQueue = reviewQueue.filter(item => item.reviewDate !== dateString)

        // 如果当天的复习任务超过了最大复习量，将剩余的复习任务延迟到下一天
        if (todayReviews.length > settings.maxReview) {
          const nextDate = DateUtils.addDays(dateString, 1)
          const remainingReviews = todayReviews.slice(settings.maxReview)

          for (const reviewItem of remainingReviews) {
            reviewQueue.push({
              word: reviewItem.word,
              reviewDate: nextDate,
              reviewCount: reviewItem.reviewCount
            })
          }
          logger.log(`⏰ 复习任务超负荷，${remainingReviews.length}个任务延期至 ${nextDate}`)
        }

        // 调试：显示每天的学习任务摘要
        const totalTasks = newWords.length + reviewWords.length

        // 只有当天的学习任务不为空时才保存
        if (newWords.length > 0 || reviewWords.length > 0) {
          tasks.push({
            date: dateString,
            newWords,
            reviewWords
          })

          logger.log(`📅 ${dateString} (${DateUtils.getDayName(dateString)}):`)
          logger.log(`   新学单词: ${newWords.length}个 ${newWords.map(w => w.word).join(', ')}`)
          logger.log(`   复习单词: ${reviewWords.length}个 ${reviewWords.map(w => w.word).join(', ')}`)
          logger.log(`   总任务: ${totalTasks}个`)
        } else {
          logger.log(`⚭ 跳过空日期: ${dateString} (无学习任务)`)
        }

        logger.log(`   复习队列剩余: ${reviewQueue.length}个`)

        // 调试：检查算法退出条件
        if (wordIndex >= words.length && reviewQueue.length === 0) {
          logger.log(`🎯 算法正常退出: 所有单词已学完且复习队列为空`)
        }
      }

      logger.log(`✅ 传统模式完成: 总共${dayIndex}天`)

      // 调试：检查未完成的复习任务
      if (reviewQueue.length > 0) {
        logger.log(`⚠️ 警告: 仍有 ${reviewQueue.length} 个复习任务未安排`)
        logger.log(`   未安排任务的日期范围: ${reviewQueue.map(item => item.reviewDate).slice(0, 5).join(', ')}...`)
      }
    }

    // 生成完成后的统计信息
    const totalDays = tasks.length
    const totalNewWords = words.length
    const totalReviewTasks = tasks.reduce((sum, task) => sum + task.reviewWords.length, 0)
    const totalStudyTasks = tasks.reduce((sum, task) => sum + task.newWords.length + task.reviewWords.length, 0)

    logger.log('📊 学习计划生成完成统计:')
    if (settings.skipWeekends && tasks.length > 0) {
      const startDate = tasks[0].date
      const endDate = tasks[tasks.length - 1].date
      const calendarDays = DateUtils.daysBetween(startDate, endDate) + 1

      logger.log(`   学习模式: 跳过周末`)
      logger.log(`   学习天数: ${totalDays}天 (工作日)`)
      logger.log(`   日历跨度: ${calendarDays}天 (包含周末)`)
      logger.log(`   跳过的周末: ${calendarDays - totalDays}天`)
    } else {
      logger.log(`   学习模式: 包含所有日期`)
      logger.log(`   总天数: ${totalDays}天`)
    }
    logger.log(`   总单词数: ${totalNewWords}个`)
    logger.log(`   总复习任务: ${totalReviewTasks}个`)
    logger.log(`   总学习任务: ${totalStudyTasks}个`)
    logger.log(`   平均每日任务: ${(totalStudyTasks / totalDays).toFixed(1)}个`)

    // 验证艾宾浩斯间隔是否正确
    const expectedReviews = totalNewWords * EBBINGHAUS_INTERVALS.length
    logger.log(`✅ 艾宾浩斯验证: 期望复习次数=${expectedReviews}, 实际安排=${totalReviewTasks}`)
    if (totalReviewTasks === expectedReviews) {
      logger.log(`   🎉 复习安排完全正确!`)
    } else {
      logger.log(`   ⚠️  复习安排可能有遗漏或重复`)
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