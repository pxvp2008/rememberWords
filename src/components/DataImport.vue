<template>
  <div class="data-import">
    <!-- 左侧浮动使用说明 -->
    <el-card class="instructions-card floating-instructions">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>使用说明</span>
        </div>
      </template>

      <el-steps :active="1" direction="vertical" size="small">
        <el-step title="下载模板文件">
          <template #description>
            点击"下载Excel模板"按钮，获取标准格式的模板文件
          </template>
        </el-step>
        <el-step title="准备单词数据">
          <template #description>
            按照模板格式填写单词和释义，支持.xlsx/.xls/.csv格式
          </template>
        </el-step>
        <el-step title="上传文件">
          <template #description>
            将准备好的Excel文件拖拽或点击上传到系统
          </template>
        </el-step>
        <el-step title="预览确认">
          <template #description>
            查看导入结果，确认无误后点击"下一步：设置参数"
          </template>
        </el-step>
      </el-steps>
    </el-card>

    <!-- 右侧主要内容 -->
    <div class="main-content">
      <el-card class="import-card">
        <template #header>
          <div class="card-header">
            <el-icon><Upload /></el-icon>
            <span>数据导入</span>
          </div>
        </template>

        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls,.csv"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将Excel文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="upload-tip">
              <div class="tip-text">
                支持 .xlsx/.xls/.csv 格式，文件需包含"单词"和"释义"两列
              </div>
              <div class="template-download">
                <el-button
                  type="text"
                  size="small"
                  @click="downloadTemplate"
                  :icon="Download"
                >
                  下载Excel模板
                </el-button>
              </div>
            </div>
          </template>
        </el-upload>

        <el-progress
          v-if="isImporting"
          :percentage="importProgress"
          :duration="3"
          :stroke-width="15"
        />

        <div v-if="words.length > 0" class="import-preview">
          <el-alert
            :title="`成功导入 ${words.length} 个单词`"
            type="success"
            show-icon
            :closable="false"
          />

          <el-table
            :data="previewWords"
            height="300"
            style="width: 100%; margin-top: 16px"
          >
            <el-table-column prop="word" label="单词" width="200" />
            <el-table-column prop="meaning" label="释义" />
          </el-table>

          <div class="preview-actions">
            <el-button @click="clearWords">清除数据</el-button>
            <el-button type="primary" @click="goToSettings">
              下一步：设置参数
            </el-button>
          </div>
        </div>

        <el-alert
          v-if="importError"
          :title="importError"
          type="error"
          show-icon
          @close="clearError"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, UploadFilled, Document, Download } from '@element-plus/icons-vue'
import { useExcel } from '@/composables/useExcel'
import { useStorage } from '@/composables/useStorage'
import { sanitizeInput } from '@/utils/sanitize'
import type { Word } from '@/types'

const emit = defineEmits<{
  next: []
}>()

const { parseExcelFile, exportToExcel, isImporting, importProgress } = useExcel()
const { words, saveWords } = useStorage()

const uploadRef = ref()
const importError = ref('')

// 预览单词（最多显示10个）
const previewWords = computed(() => words.value.slice(0, 10))

// 处理文件选择
const handleFileChange = async (file: any) => {
  importError.value = ''

  try {
    const result = await parseExcelFile(file.raw)

    if (result.success && result.words) {
      words.value = result.words
      saveWords(result.words)
      ElMessage.success(`成功导入 ${result.words.length} 个单词`)
    } else {
      importError.value = result.error || '导入失败'
    }
  } catch (error) {
    console.error('文件处理错误:', error)
    importError.value = '文件处理失败，请重试'
  }
}

// 清除单词数据
const clearWords = () => {
  words.value = []
  uploadRef.value?.clearFiles()
}

// 清除错误信息
const clearError = () => {
  importError.value = ''
}

// 下载Excel模板
const downloadTemplate = () => {
  const templateData = [
    {
      '单词': sanitizeInput('apple'),
      '释义': sanitizeInput('苹果')
    },
    {
      '单词': sanitizeInput('book'),
      '释义': sanitizeInput('书')
    },
    {
      '单词': sanitizeInput('computer'),
      '释义': sanitizeInput('计算机')
    },
    {
      '单词': sanitizeInput('beautiful'),
      '释义': sanitizeInput('美丽的')
    },
    {
      '单词': sanitizeInput('important'),
      '释义': sanitizeInput('重要的')
    }
  ]

  const success = exportToExcel(templateData, '单词导入模板')
  if (success) {
    ElMessage.success('模板下载成功')
  } else {
    ElMessage.error('模板下载失败，请重试')
  }
}

// 跳转到参数设置
const goToSettings = () => {
  emit('next')
}

// 监听数据变化，清除上传组件状态
watch(words, (newWords) => {
  if (newWords.length === 0) {
    importError.value = ''
    uploadRef.value?.clearFiles()
  }
})
</script>

<style scoped>
.data-import {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

/* 左侧浮动使用说明 */
.floating-instructions {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  height: fit-content;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: none;
}

/* 右侧主要内容 */
.main-content {
  flex: 1;
  min-width: 0;
}

.import-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.upload-demo {
  margin-bottom: 20px;
}

.import-preview {
  margin-top: 20px;
}

.preview-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.upload-tip {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 8px;
}

.template-download {
  display: flex;
  justify-content: center;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

/* 使用说明步骤样式优化 */
:deep(.floating-instructions .el-step__title) {
  font-size: 14px !important;
  font-weight: 500 !important;
}

:deep(.floating-instructions .el-step__description) {
  font-size: 12px !important;
  line-height: 1.4 !important;
  margin-top: 4px !important;
}

:deep(.floating-instructions .el-step__icon) {
  width: 24px !important;
  height: 24px !important;
}

:deep(.floating-instructions .el-step__icon-inner) {
  font-size: 12px !important;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .data-import {
    flex-direction: column;
    gap: 16px;
  }

  .floating-instructions {
    width: 100%;
    position: static;
    order: 2;
  }

  .main-content {
    order: 1;
  }
}

@media (max-width: 768px) {
  .data-import {
    padding: 16px;
  }

  .floating-instructions {
    margin-bottom: 16px;
  }

  :deep(.floating-instructions .el-step__title) {
    font-size: 13px !important;
  }

  :deep(.floating-instructions .el-step__description) {
    font-size: 11px !important;
  }
}
</style>