<template>
  <div class="template-selector">
    <a-button type="outline" @click="showDialog = true">
      <template #icon>
        <icon-file />
      </template>
      选择模板
    </a-button>

    <a-modal
      v-model:visible="showDialog"
      title="选择文档模板"
      :width="800"
      @ok="handleApplyTemplate"
      @cancel="showDialog = false"
    >
      <div class="template-list">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索模板"
          style="margin-bottom: 16px;"
          @search="loadTemplates"
        />

        <a-radio-group v-model="selectedTemplateId">
          <a-space direction="vertical" :size="16" style="width: 100%;">
            <a-radio
              v-for="template in templates"
              :key="template.id"
              :value="template.id"
              class="template-item"
            >
              <div class="template-info">
                <div class="template-title">{{ template.title }}</div>
                <div class="template-description">{{ template.description || '无描述' }}</div>
                <div class="template-meta">
                  <a-tag size="small">{{ template.scope || 'SYSTEM' }}</a-tag>
                  <span class="template-time">
                    {{ formatTime(template.createdAt) }}
                  </span>
                </div>
              </div>
            </a-radio>
          </a-space>
        </a-radio-group>

        <div v-if="templates.length === 0" class="empty">
          <a-empty description="暂无模板" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconFile } from '@arco-design/web-vue/es/icon'
import api from '../api/index'

const emit = defineEmits(['template-selected'])

const showDialog = ref(false)
const templates = ref([])
const selectedTemplateId = ref(null)
const searchKeyword = ref('')
const loading = ref(false)

const loadTemplates = async () => {
  loading.value = true
  try {
    const params = {
      page: 1,
      size: 50,
      title: searchKeyword.value || undefined
    }
    const res = await api.documentTemplateApi.getTemplateList(params)
    templates.value = res.data.records || []
  } catch (error) {
    Message.error('加载模板失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleApplyTemplate = async () => {
  if (!selectedTemplateId.value) {
    Message.warning('请选择一个模板')
    return
  }

  try {
    const res = await api.documentTemplateApi.applyTemplate(selectedTemplateId.value)
    emit('template-selected', res.data)
    Message.success('模板应用成功')
    showDialog.value = false
  } catch (error) {
    Message.error('应用模板失败')
    console.error(error)
  }
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped lang="scss">
.template-list {
  max-height: 500px;
  overflow-y: auto;
}

.template-item {
  display: block;
  width: 100%;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #1890ff;
    background: #f0f9ff;
  }
}

.template-info {
  width: 100%;
}

.template-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1d2129;
}

.template-description {
  font-size: 14px;
  color: #86909c;
  margin-bottom: 12px;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.template-time {
  font-size: 12px;
  color: #86909c;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}
</style>

