<template>
  <div class="collaborator-panel">
    <div class="panel-header">
      <h3>协作者</h3>
      <a-button type="primary" size="small" @click="showAddDialog = true">
        <template #icon>
          <icon-plus />
        </template>
        添加协作者
      </a-button>
    </div>

    <div class="collaborator-list">
      <div v-if="loading" class="loading">
        <a-spin />
      </div>
      <div v-else-if="collaborators.length === 0" class="empty">
        <a-empty description="暂无协作者" />
      </div>
      <div v-else>
        <div
          v-for="collaborator in collaborators"
          :key="collaborator.id"
          class="collaborator-item"
        >
          <div class="collaborator-info">
            <a-avatar :size="40">{{ collaborator.userId }}</a-avatar>
            <div class="collaborator-details">
              <div class="collaborator-name">用户 {{ collaborator.userId }}</div>
              <a-tag :color="getRoleColor(collaborator.role)">
                {{ getRoleName(collaborator.role) }}
              </a-tag>
            </div>
          </div>
          <div class="collaborator-actions">
            <a-button
              type="text"
              size="small"
              @click="editCollaborator(collaborator)"
            >
              修改角色
            </a-button>
            <a-popconfirm
              content="确定要移除这个协作者吗？"
              @ok="removeCollaborator(collaborator.id)"
            >
              <a-button type="text" size="small" status="danger">
                移除
              </a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加协作者对话框 -->
    <a-modal
      v-model:visible="showAddDialog"
      title="添加协作者"
      :width="500"
      @ok="handleAddCollaborator"
      @cancel="showAddDialog = false"
    >
      <a-form :model="collaboratorForm" layout="vertical">
        <a-form-item label="用户ID或邮箱" field="userId">
          <a-input
            v-model="collaboratorForm.userId"
            placeholder="请输入用户ID或邮箱"
          />
        </a-form-item>
        <a-form-item label="角色" field="role">
          <a-select v-model="collaboratorForm.role" placeholder="请选择角色">
            <a-option value="VIEWER">查看者</a-option>
            <a-option value="EDITOR">编辑者</a-option>
            <a-option value="ADMIN">管理员</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑角色对话框 -->
    <a-modal
      v-model:visible="showEditDialog"
      title="修改角色"
      :width="400"
      @ok="handleUpdateRole"
      @cancel="showEditDialog = false"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="角色" field="role">
          <a-select v-model="editForm.role" placeholder="请选择角色">
            <a-option value="VIEWER">查看者</a-option>
            <a-option value="EDITOR">编辑者</a-option>
            <a-option value="ADMIN">管理员</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import api from '../api/index'

const props = defineProps({
  knowledgeBaseId: {
    type: [String, Number],
    required: true
  }
})

const collaborators = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingCollaborator = ref(null)

const collaboratorForm = ref({
  userId: '',
  role: 'VIEWER'
})

const editForm = ref({
  role: 'VIEWER'
})

const loadCollaborators = async () => {
  if (!props.knowledgeBaseId) return
  loading.value = true
  try {
    const res = await api.knowledgeBaseCollaboratorApi.getCollaboratorsByKnowledgeBaseId(
      props.knowledgeBaseId
    )
    collaborators.value = res.data || []
  } catch (error) {
    Message.error('加载协作者失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleAddCollaborator = async () => {
  if (!collaboratorForm.value.userId.trim()) {
    Message.warning('请输入用户ID或邮箱')
    return
  }

  try {
    await api.knowledgeBaseCollaboratorApi.createCollaborator({
      knowledgeBaseId: props.knowledgeBaseId,
      userId: collaboratorForm.value.userId,
      role: collaboratorForm.value.role
    })
    Message.success('协作者添加成功')
    showAddDialog.value = false
    collaboratorForm.value = {
      userId: '',
      role: 'VIEWER'
    }
    loadCollaborators()
  } catch (error) {
    Message.error('添加协作者失败')
    console.error(error)
  }
}

const editCollaborator = (collaborator) => {
  editingCollaborator.value = collaborator
  editForm.value.role = collaborator.role
  showEditDialog.value = true
}

const handleUpdateRole = async () => {
  if (!editingCollaborator.value) return

  try {
    await api.knowledgeBaseCollaboratorApi.updateCollaborator({
      id: editingCollaborator.value.id,
      role: editForm.value.role
    })
    Message.success('角色更新成功')
    showEditDialog.value = false
    editingCollaborator.value = null
    loadCollaborators()
  } catch (error) {
    Message.error('更新角色失败')
    console.error(error)
  }
}

const removeCollaborator = async (id) => {
  try {
    await api.knowledgeBaseCollaboratorApi.deleteCollaborator(id)
    Message.success('协作者已移除')
    loadCollaborators()
  } catch (error) {
    Message.error('移除失败')
    console.error(error)
  }
}

const getRoleName = (role) => {
  const roleMap = {
    VIEWER: '查看者',
    EDITOR: '编辑者',
    ADMIN: '管理员'
  }
  return roleMap[role] || role
}

const getRoleColor = (role) => {
  const colorMap = {
    VIEWER: 'blue',
    EDITOR: 'orange',
    ADMIN: 'red'
  }
  return colorMap[role] || 'blue'
}

watch(() => props.knowledgeBaseId, () => {
  loadCollaborators()
}, { immediate: true })

onMounted(() => {
  loadCollaborators()
})
</script>

<style scoped lang="scss">
.collaborator-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.collaborator-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #86909c;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.collaborator-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.collaborator-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collaborator-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collaborator-name {
  font-weight: 500;
  font-size: 14px;
}

.collaborator-actions {
  display: flex;
  gap: 8px;
}
</style>

