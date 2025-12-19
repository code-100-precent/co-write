<template>
  <div class="webhook-management">
    <div class="page-header">
      <h2>Webhook管理</h2>
      <a-button type="primary" @click="showCreateDialog = true">
        <template #icon>
          <icon-plus />
        </template>
        创建Webhook
      </a-button>
    </div>

    <a-card>
      <div class="toolbar">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索Webhook"
          style="width: 300px;"
          @search="loadWebhooks"
        />
      </div>

      <a-table
        :columns="columns"
        :data="webhooks"
        :pagination="pagination"
        :loading="loading"
        @page-change="handlePageChange"
        style="margin-top: 16px;"
      >
        <template #enabled="{ record }">
          <a-switch
            v-model="record.enabled"
            @change="handleToggleEnabled(record)"
          />
        </template>
        <template #operations="{ record }">
          <a-button type="text" size="small" @click="editWebhook(record)">
            编辑
          </a-button>
          <a-button type="text" size="small" @click="testWebhook(record)">
            测试
          </a-button>
          <a-popconfirm
            content="确定要删除这个Webhook吗？"
            @ok="handleDeleteWebhook(record.id)"
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
      :title="editingWebhook ? '编辑Webhook' : '创建Webhook'"
      :width="600"
      @ok="handleSaveWebhook"
      @cancel="cancelEdit"
    >
      <a-form :model="webhookForm" layout="vertical">
        <a-form-item label="名称" field="name">
          <a-input v-model="webhookForm.name" placeholder="请输入Webhook名称" />
        </a-form-item>
        <a-form-item label="URL" field="url">
          <a-input v-model="webhookForm.url" placeholder="https://example.com/webhook" />
        </a-form-item>
        <a-form-item label="事件类型" field="events">
          <a-checkbox-group v-model="webhookForm.events">
            <a-checkbox value="document.created">文档创建</a-checkbox>
            <a-checkbox value="document.updated">文档更新</a-checkbox>
            <a-checkbox value="document.deleted">文档删除</a-checkbox>
            <a-checkbox value="comment.created">评论创建</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
        <a-form-item label="启用状态" field="enabled">
          <a-switch v-model="webhookForm.enabled" />
        </a-form-item>
        <a-form-item label="描述" field="description">
          <a-textarea
            v-model="webhookForm.description"
            placeholder="请输入描述（可选）"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import api from '../../api/index'

const webhooks = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const editingWebhook = ref(null)
const searchKeyword = ref('')

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

const columns = [
  {
    title: '名称',
    dataIndex: 'name'
  },
  {
    title: 'URL',
    dataIndex: 'url'
  },
  {
    title: '事件类型',
    dataIndex: 'events',
    render: ({ record }) => {
      return Array.isArray(record.events) ? record.events.join(', ') : record.events
    }
  },
  {
    title: '启用',
    dataIndex: 'enabled',
    slotName: 'enabled'
  },
  {
    title: '操作',
    slotName: 'operations'
  }
]

const webhookForm = ref({
  name: '',
  url: '',
  events: [],
  enabled: true,
  description: ''
})

const loadWebhooks = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.current,
      size: pagination.value.pageSize,
      keyword: searchKeyword.value || undefined
    }
    const res = await api.webhookApi.getWebhookPage(params)
    webhooks.value = res.data.records || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    Message.error('加载Webhook列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSaveWebhook = async () => {
  if (!webhookForm.value.name.trim() || !webhookForm.value.url.trim()) {
    Message.warning('请填写名称和URL')
    return
  }

  try {
    if (editingWebhook.value) {
      await api.webhookApi.updateWebhook({
        id: editingWebhook.value.id,
        ...webhookForm.value
      })
      Message.success('Webhook更新成功')
    } else {
      await api.webhookApi.createWebhook(webhookForm.value)
      Message.success('Webhook创建成功')
    }
    showCreateDialog.value = false
    cancelEdit()
    loadWebhooks()
  } catch (error) {
    Message.error(editingWebhook.value ? '更新Webhook失败' : '创建Webhook失败')
    console.error(error)
  }
}

const editWebhook = (webhook) => {
  editingWebhook.value = webhook
  webhookForm.value = {
    name: webhook.name,
    url: webhook.url,
    events: Array.isArray(webhook.events) ? webhook.events : [],
    enabled: webhook.enabled !== false,
    description: webhook.description || ''
  }
  showCreateDialog.value = true
}

const cancelEdit = () => {
  editingWebhook.value = null
  webhookForm.value = {
    name: '',
    url: '',
    events: [],
    enabled: true,
    description: ''
  }
}

const handleDeleteWebhook = async (id) => {
  try {
    await api.webhookApi.deleteWebhook(id)
    Message.success('Webhook已删除')
    loadWebhooks()
  } catch (error) {
    Message.error('删除失败')
    console.error(error)
  }
}

const handleToggleEnabled = async (webhook) => {
  try {
    await api.webhookApi.updateWebhook({
      id: webhook.id,
      enabled: webhook.enabled
    })
    Message.success('状态已更新')
  } catch (error) {
    Message.error('更新状态失败')
    webhook.enabled = !webhook.enabled
    console.error(error)
  }
}

const testWebhook = async (webhook) => {
  Message.info('测试功能待实现')
  // TODO: 实现Webhook测试功能
}

const handlePageChange = (page) => {
  pagination.value.current = page
  loadWebhooks()
}

onMounted(() => {
  loadWebhooks()
})
</script>

<style scoped lang="scss">
.webhook-management {
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
</style>

