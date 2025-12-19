<template>
  <div class="template-management">
    <div class="page-header">
      <h2>模板管理</h2>
      <a-button type="primary" @click="showCreateDialog = true">
        <template #icon>
          <icon-plus />
        </template>
        创建模板
      </a-button>
    </div>

    <a-card>
      <div class="toolbar">
        <a-space>
          <a-input-search
            v-model="searchKeyword"
            placeholder="搜索模板"
            style="width: 300px;"
            @search="loadTemplates"
          />
          <a-select
            v-model="scopeFilter"
            placeholder="筛选范围"
            style="width: 150px;"
            @change="loadTemplates"
          >
            <a-option value="">全部</a-option>
            <a-option value="SYSTEM">系统模板</a-option>
            <a-option value="PERSONAL">个人模板</a-option>
            <a-option value="ORGANIZATION">组织模板</a-option>
          </a-select>
        </a-space>
      </div>

      <a-table
        :columns="columns"
        :data="templates"
        :pagination="pagination"
        :loading="loading"
        @page-change="handlePageChange"
        style="margin-top: 16px;"
      >
        <template #scope="{ record }">
          <a-tag :color="getScopeColor(record.scope)">
            {{ getScopeName(record.scope) }}
          </a-tag>
        </template>
        <template #operations="{ record }">
          <a-button type="text" size="small" @click="previewTemplate(record)">
            预览
          </a-button>
          <a-button type="text" size="small" @click="editTemplate(record)">
            编辑
          </a-button>
          <a-button type="text" size="small" @click="downloadTemplate(record.id)">
            下载
          </a-button>
          <a-popconfirm
            content="确定要删除这个模板吗？"
            @ok="handleDeleteTemplate(record.id)"
          >
            <a-button type="text" size="small" status="danger">
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑对话框 -->
    <a-modal
      v-model:visible="showCreateDialog"
      :title="editingTemplate ? '编辑模板' : '创建模板'"
      :width="800"
      @ok="handleSaveTemplate"
      @cancel="cancelEdit"
    >
      <a-form :model="templateForm" layout="vertical">
        <a-form-item label="模板标题" field="title">
          <a-input v-model="templateForm.title" placeholder="请输入模板标题" />
        </a-form-item>
        <a-form-item label="模板描述" field="description">
          <a-textarea
            v-model="templateForm.description"
            placeholder="请输入模板描述"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="模板范围" field="scope">
          <a-select v-model="templateForm.scope" placeholder="请选择模板范围">
            <a-option value="SYSTEM">系统模板</a-option>
            <a-option value="PERSONAL">个人模板</a-option>
            <a-option value="ORGANIZATION">组织模板</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="模板内容（Markdown）" field="content">
          <a-textarea
            v-model="templateForm.content"
            placeholder="请输入模板内容（Markdown格式）"
            :rows="10"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 预览对话框 -->
    <a-modal
      v-model:visible="showPreviewDialog"
      title="模板预览"
      :width="900"
      :footer="false"
    >
      <div v-if="previewContent" class="preview-content">
        <div v-html="renderMarkdown(previewContent)"></div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import api from '../../api/index'

const templates = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showPreviewDialog = ref(false)
const editingTemplate = ref(null)
const searchKeyword = ref('')
const scopeFilter = ref('')
const previewContent = ref('')

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

const columns = [
  {
    title: '标题',
    dataIndex: 'title'
  },
  {
    title: '描述',
    dataIndex: 'description'
  },
  {
    title: '范围',
    dataIndex: 'scope',
    slotName: 'scope'
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    render: ({ record }) => formatTime(record.createdAt)
  },
  {
    title: '操作',
    slotName: 'operations'
  }
]

const templateForm = ref({
  title: '',
  description: '',
  scope: 'PERSONAL',
  content: ''
})

const loadTemplates = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.current,
      size: pagination.value.pageSize,
      title: searchKeyword.value || undefined,
      scope: scopeFilter.value || undefined
    }
    const res = await api.documentTemplateApi.getTemplateList(params)
    templates.value = res.data.records || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    Message.error('加载模板列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSaveTemplate = async () => {
  if (!templateForm.value.title.trim() || !templateForm.value.content.trim()) {
    Message.warning('请填写标题和内容')
    return
  }

  try {
    if (editingTemplate.value) {
      await api.documentTemplateApi.updateTemplate({
        id: editingTemplate.value.id,
        ...templateForm.value
      })
      Message.success('模板更新成功')
    } else {
      await api.documentTemplateApi.createTemplate(templateForm.value)
      Message.success('模板创建成功')
    }
    showCreateDialog.value = false
    cancelEdit()
    loadTemplates()
  } catch (error) {
    Message.error(editingTemplate.value ? '更新模板失败' : '创建模板失败')
    console.error(error)
  }
}

const editTemplate = async (template) => {
  try {
    const res = await api.documentTemplateApi.getTemplateById(template.id)
    editingTemplate.value = res.data
    templateForm.value = {
      title: res.data.title,
      description: res.data.description || '',
      scope: res.data.scope || 'PERSONAL',
      content: '' // 内容需要从MongoDB获取，这里先留空
    }
    // 获取模板内容
    const contentRes = await api.documentTemplateApi.applyTemplate(template.id)
    templateForm.value.content = contentRes.data || ''
    showCreateDialog.value = true
  } catch (error) {
    Message.error('加载模板失败')
    console.error(error)
  }
}

const previewTemplate = async (template) => {
  try {
    const res = await api.documentTemplateApi.applyTemplate(template.id)
    previewContent.value = res.data || ''
    showPreviewDialog.value = true
  } catch (error) {
    Message.error('加载模板内容失败')
    console.error(error)
  }
}

const downloadTemplate = async (id) => {
  try {
    const res = await api.documentTemplateApi.downloadTemplate(id)
    // 创建下载链接
    const blob = new Blob([res.data], { type: 'text/markdown' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-${id}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    Message.success('模板下载成功')
  } catch (error) {
    Message.error('下载模板失败')
    console.error(error)
  }
}

const handleDeleteTemplate = async (id) => {
  try {
    await api.documentTemplateApi.deleteTemplate(id)
    Message.success('模板已删除')
    loadTemplates()
  } catch (error) {
    Message.error('删除失败')
    console.error(error)
  }
}

const cancelEdit = () => {
  editingTemplate.value = null
  templateForm.value = {
    title: '',
    description: '',
    scope: 'PERSONAL',
    content: ''
  }
}

const getScopeName = (scope) => {
  const scopeMap = {
    SYSTEM: '系统模板',
    PERSONAL: '个人模板',
    ORGANIZATION: '组织模板'
  }
  return scopeMap[scope] || scope
}

const getScopeColor = (scope) => {
  const colorMap = {
    SYSTEM: 'red',
    PERSONAL: 'blue',
    ORGANIZATION: 'green'
  }
  return colorMap[scope] || 'blue'
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const renderMarkdown = (content) => {
  // 简单的Markdown渲染（实际项目中可以使用marked等库）
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

const handlePageChange = (page) => {
  pagination.value.current = page
  loadTemplates()
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped lang="scss">
.template-management {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-content {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  max-height: 600px;
  overflow-y: auto;
}
</style>

