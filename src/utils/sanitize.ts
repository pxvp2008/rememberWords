/**
 * 输入验证和XSS防护工具函数
 */

// 最大长度限制
export const MAX_WORD_LENGTH = 100
export const MAX_MEANING_LENGTH = 500
export const MAX_EXCEL_ROWS = 1000
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * 清理输入字符串，防止XSS攻击
 * @param input 原始输入字符串
 * @param maxLength 最大长度限制
 * @returns 清理后的安全字符串
 */
export const sanitizeInput = (input: string, maxLength: number = MAX_WORD_LENGTH): string => {
  if (typeof input !== 'string') {
    return ''
  }

  // 移除 HTML 标签
  let cleaned = input.replace(/<[^>]*>/g, '')

  // 移除潜在的 JavaScript 代码和危险字符
  cleaned = cleaned.replace(/javascript:/gi, '')
  cleaned = cleaned.replace(/on\w+\s*=/gi, '')

  // 只移除最危险的特殊字符，保留更多有用的符号
  cleaned = cleaned.replace(/[<>{}]/g, '')

  // 去除首尾空格
  cleaned = cleaned.trim()

  // 长度限制
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength)
  }

  return cleaned
}

/**
 * 验证单词格式是否有效
 * @param word 单词字符串
 * @returns 是否有效
 */
export const validateWord = (word: string): boolean => {
  if (!word || typeof word !== 'string') {
    return false
  }

  const cleaned = sanitizeInput(word, MAX_WORD_LENGTH)

  // 更宽松的单词验证：允许字母、数字、中文和常见符号
  // 移除了过于严格的正则表达式，只要有内容就认为是有效的
  // 因为有些单词可能包含数字、点号、斜杠等字符
  return cleaned.length >= 1 && cleaned.length <= MAX_WORD_LENGTH
}

/**
 * 验证释义格式是否有效
 * @param meaning 释义字符串
 * @returns 是否有效
 */
export const validateMeaning = (meaning: string): boolean => {
  if (!meaning || typeof meaning !== 'string') {
    return false
  }

  const cleaned = sanitizeInput(meaning, MAX_MEANING_LENGTH)

  // 释义不能为空且长度合理
  return cleaned.length >= 1 && cleaned.length <= MAX_MEANING_LENGTH
}

/**
 * 验证Excel行数据
 * @param row Excel行数据
 * @returns 验证结果
 */
export const validateExcelRow = (row: Record<string, unknown>): {
  isValid: boolean
  word?: string
  meaning?: string
  error?: string
} => {
  try {
    // 查找单词和释义列
    let wordColumn = ''
    let meaningColumn = ''

    const keys = Object.keys(row)
    for (const key of keys) {
      const keyLower = String(key).toLowerCase().trim()
      // 扩展单词列的匹配关键词
      if (keyLower.includes('单词') || keyLower.includes('word') || keyLower.includes('词汇') ||
          keyLower.includes('english') || keyLower.includes('eng') || keyLower === 'a' ||
          keyLower === 'word' || keyLower === 'vocabulary') {
        wordColumn = key
      }
      // 扩展释义列的匹配关键词
      else if (keyLower.includes('释义') || keyLower.includes('meaning') || keyLower.includes('翻译') ||
               keyLower.includes('解释') || keyLower.includes('中文') || keyLower.includes('chinese') ||
               keyLower.includes('cn') || keyLower === 'b' || keyLower === 'meaning' ||
               keyLower.includes('definition')) {
        meaningColumn = key
      }
    }

    // 如果没找到对应列，使用前两列
    if (!wordColumn && keys.length >= 1) wordColumn = keys[0]
    if (!meaningColumn && keys.length >= 2) meaningColumn = keys[1]

    if (!wordColumn || !meaningColumn) {
      return { isValid: false, error: '未找到有效的单词或释义列' }
    }

    const rawWord = String(row[wordColumn] || '').trim()
    const rawMeaning = String(row[meaningColumn] || '').trim()

    const word = sanitizeInput(rawWord, MAX_WORD_LENGTH)
    const meaning = sanitizeInput(rawMeaning, MAX_MEANING_LENGTH)

    // 更宽松的验证：只要有内容就接受
    if (!word || !meaning) {
      return { isValid: false, error: '单词或释义不能为空' }
    }

    // 移除过于严格的验证，只要有内容就认为是有效的
    // if (!validateWord(word)) {
    //   return { isValid: false, error: '单词格式无效' }
    // }

    // if (!validateMeaning(meaning)) {
    //   return { isValid: false, error: '释义格式无效' }
    // }

    return { isValid: true, word, meaning }

  } catch (error) {
    return { isValid: false, error: '数据验证失败' }
  }
}

/**
 * 验证文件类型和大小
 * @param file 文件对象
 * @returns 验证结果
 */
export const validateFile = (file: File): {
  isValid: boolean
  error?: string
} => {
  // 检查文件类型
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '不支持的文件格式，请上传 .xlsx、.xls 或 .csv 文件'
    }
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `文件过大，请上传小于${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB的文件`
    }
  }

  return { isValid: true }
}

/**
 * 转义HTML特殊字符
 * @param text 原始文本
 * @returns 转义后的文本
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 生成安全的ID
 * @param prefix ID前缀
 * @param suffix ID后缀
 * @returns 安全的ID字符串
 */
export const generateSafeId = (prefix: string, suffix: string | number): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${suffix}_${timestamp}_${random}`.replace(/[^a-zA-Z0-9_]/g, '_')
}