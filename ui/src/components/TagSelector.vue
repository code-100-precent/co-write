<template>
  <div class="tag-selector">
    <div class="tag-selector-header">
      <span class="label">标签：</span>
      <a-button type="text" size="small" @click="showManageDialog = true">
        管理标签
      </a-button>
    </div>
    <div class="tag-list">
      <a-tag
        v-for="tag in selectedTags"
        :key="tag.id"
        :color="tag.color || 'blue'"
        closable
        @close="removeTag(tag.id)"
        style="margin-right: 8px; margin-bottom: 8px;"
      >
        {{ tag.name }}
      </a-tag>
      <a-button
        type="outline"
        size="small"
        @click="showAddDialog = true"
        style="margin-bottom: 8px;"
      >
        <template #icon>
          <icon-plus />
        </template>
        添加标签
      </a-button>
    </div>

    <!-- 添加标签对话框 -->
    <a-modal
      v-model:visible="showAddDialog"
      title="选择标签"
      :width="500"
      @ok="handleAddTags"
      @cancel="showAddDialog = false"
    >
      <div class="available-tags">
        <a-checkbox-group v-model="tagsToAdd">
          <div
            v-for="tag in availableTags"
            :key="tag.id"
            class="tag-option"
          >
            <a-checkbox :value="tag.id">
              <a-tag :color="tag.color || 'blue'">{{ tag.name }}</a-tag>
            </a-checkbox>
          </div>
        </a-checkbox-group>
        <div v-if="availableTags.length === 0" class="empty-tags">
          暂无可用标签，请先创建标签
        </div>
      </div>
    </a-modal>

    <!-- 管理标签对话框 -->
    <a-modal
      v-model:visible="showManageDialog"
      title="管理标签"
      :width="700"
      :footer="false"
    >
      <div class="tag-management">
        <div class="tag-management-header">
          <a-input-search
            v-model="searchKeyword"
            placeholder="搜索标签"
            style="width: 300px;"
            @search="loadTags"
          />
          <a-button type="primary" @click="showCreateDialog = true">
            <template #icon>
              <icon-plus />
            </template>
            创建标签
          </a-button>
        </div>

        <a-table
          :columns="columns"
          :data="allTags"
          :pagination="pagination"
          @page-change="handlePageChange"
          style="margin-top: 16px;"
        >
          <template #color="{ record }">
            <div
              class="color-preview"
              :style="{ backgroundColor: record.color || '#1890ff' }"
            />
          </template>
          <template #operations="{ record }">
            <a-button type="text" size="small" @click="editTag(record)">
              编辑
            </a-button>
            <a-popconfirm
              content="确定要删除这个标签吗？"
              @ok="handleDeleteTag(record.id)"
            >
              <a-button type="text" size="small" status="danger">
                删除
              </a-button>
            </a-popconfirm>
          </template>
        </a-table>
      </div>
    </a-modal>

    <!-- 创建/编辑标签对话框 -->
    <a-modal
      v-model:visible="showCreateDialog"
      :title="editingTag ? '编辑标签' : '创建标签'"
      :width="500"
      @ok="handleSaveTag"
      @cancel="cancelEdit"
    >
      <a-form :model="tagForm" layout="vertical">
        <a-form-item label="标签名称" field="name">
          <a-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </a-form-item>
        <a-form-item label="标签颜色" field="color">
          <a-input
            v-model="tagForm.color"
            placeholder="#1890ff"
            type="color"
            style="width: 100px;"
          />
        </a-form-item>
        <a-form-item label="描述" field="description">
          <a-textarea
            v-model="tagForm.description"
            placeholder="请输入标签描述（可选）"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import api from '../api/index'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  documentId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedTags = ref([])
const availableTags = ref([])
const allTags = ref([])
const showAddDialog = ref(false)
const showManageDialog = ref(false)
const showCreateDialog = ref(false)
const editingTag = ref(null)
const searchKeyword = ref('')
const tagsToAdd = ref([])

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

const columns = [
  {
    title: '标签名称',
    dataIndex: 'name'
  },
  {
    title: '颜色',
    dataIndex: 'color',
    slotName: 'color'
  },
  {
    title: '描述',
    dataIndex: 'description'
  },
  {
    title: '操作',
    slotName: 'operations'
  }
]

const tagForm = ref({
  name: '',
  color: '#1890ff',
  description: ''
})

const loadSelectedTags = async () => {
  if (!props.documentId) return
  try {
    const res = await api.documentTagApi.getTagsByDocumentId(props.documentId)
    selectedTags.value = res.data || []
    emit('update:modelValue', selectedTags.value)
  } catch (error) {
    console.error('加载文档标签失败', error)
  }
}

const loadAvailableTags = async () => {
  try {
    const res = await api.tagApi.getTags()
    const selectedIds = selectedTags.value.map(t => t.id)
    availableTags.value = (res.data || []).filter(t => !selectedIds.includes(t.id))
  } catch (error) {
    Message.error('加载标签失败')
    console.error(error)
  }
}

const loadTags = async () => {
  try {
    const params = {
      page: pagination.value.current,
      size: pagination.value.pageSize,
      keyword: searchKeyword.value
    }
    const res = await api.tagApi.getTagPage(params)
    allTags.value = res.data.records || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    Message.error('加载标签列表失败')
    console.error(error)
  }
}

const handleAddTags = async () => {
  if (tagsToAdd.value.length === 0) {
    Message.warning('请选择要添加的标签')
    return
  }

  try {
    const promises = tagsToAdd.value.map(tagId => {
      const tag = availableTags.value.find(t => t.id === tagId)
      return api.documentTagApi.createDocumentTag({
        entityId: props.documentId,
        entityType: 'document',
        tagId: tagId
      }).then(() => tag)
    })

    const addedTags = await Promise.all(promises)
    selectedTags.value.push(...addedTags)
    emit('update:modelValue', selectedTags.value)
    showAddDialog.value = false
    tagsToAdd.value = []
    loadAvailableTags()
    Message.success('标签添加成功')
  } catch (error) {
    Message.error('添加标签失败')
    console.error(error)
  }
}

const removeTag = async (tagId) => {
  try {
    const relation = await findDocumentTagRelation(tagId)
    if (relation) {
      await api.documentTagApi.deleteDocumentTag(relation.id)
      selectedTags.value = selectedTags.value.filter(t => t.id !== tagId)
      emit('update:modelValue', selectedTags.value)
      loadAvailableTags()
      Message.success('标签已移除')
    }
  } catch (error) {
    Message.error('移除标签失败')
    console.error(error)
  }
}

const findDocumentTagRelation = async (tagId) => {
  try {
    const res = await api.documentTagApi.getDocumentTags()
    const relations = res.data || []
    return relations.find(r => r.tagId === tagId && r.entityId === props.documentId)
  } catch (error) {
    console.error(error)
    return null
  }
}

const handleSaveTag = async () => {
  if (!tagForm.value.name.trim()) {
    Message.warning('请输入标签名称')
    return
  }

  try {
    if (editingTag.value) {
      await api.tagApi.updateTag({
        id: editingTag.value.id,
        ...tagForm.value
      })
      Message.success('标签更新成功')
    } else {
      await api.tagApi.createTag(tagForm.value)
      Message.success('标签创建成功')
    }
    showCreateDialog.value = false
    cancelEdit()
    loadTags()
    loadAvailableTags()
  } catch (error) {
    Message.error(editingTag.value ? '更新标签失败' : '创建标签失败')
    console.error(error)
  }
}

const editTag = (tag) => {
  editingTag.value = tag
  tagForm.value = {
    name: tag.name,
    color: tag.color || '#1890ff',
    description: tag.description || ''
  }
  showCreateDialog.value = true
}

const cancelEdit = () => {
  editingTag.value = null
  tagForm.value = {
    name: '',
    color: '#1890ff',
    description: ''
  }
}

const handleDeleteTag = async (id) => {
  try {
    await api.tagApi.deleteTag(id)
    Message.success('标签已删除')
    loadTags()
    loadAvailableTags()
    // 如果删除的标签在已选列表中，也要移除
    selectedTags.value = selectedTags.value.filter(t => t.id !== id)
    emit('update:modelValue', selectedTags.value)
  } catch (error) {
    Message.error('删除标签失败')
    console.error(error)
  }
}

const handlePageChange = (page) => {
  pagination.value.current = page
  loadTags()
}

watch(() => props.documentId, () => {
  loadSelectedTags()
  loadAvailableTags()
}, { immediate: true })

onMounted(() => {
  loadTags()
  loadAvailableTags()
})
</script>

<style scoped lang="scss">
.tag-selector {
  margin-bottom: 16px;
}

.tag-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .label {
    font-weight: 500;
    font-size: 14px;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.available-tags {
  max-height: 300px;
  overflow-y: auto;
}

.tag-option {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.empty-tags {
  text-align: center;
  padding: 40px;
  color: #86909c;
}

.tag-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}
</style>

