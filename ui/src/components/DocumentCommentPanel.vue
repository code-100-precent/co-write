<template>
  <div class="comment-panel">
    <div class="comment-header">
      <h3>评论</h3>
      <a-button type="primary" size="small" @click="showCreateDialog = true">
        <template #icon>
          <icon-plus />
        </template>
        添加评论
      </a-button>
    </div>

    <div class="comment-list">
      <div v-if="loading" class="loading">
        <a-spin />
      </div>
      <div v-else-if="comments.length === 0" class="empty">
        <a-empty description="暂无评论" />
      </div>
      <div v-else>
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item"
          :class="{ resolved: comment.status === 'RESOLVED' }"
        >
          <div class="comment-header-item">
            <div class="comment-author">
              <a-avatar :size="32">{{ comment.userId }}</a-avatar>
              <span class="author-name">用户 {{ comment.userId }}</span>
              <a-tag
                :color="comment.status === 'RESOLVED' ? 'green' : 'blue'"
                size="small"
              >
                {{ comment.status === 'RESOLVED' ? '已解决' : '活跃' }}
              </a-tag>
            </div>
            <div class="comment-actions">
              <a-button
                v-if="comment.status === 'ACTIVE'"
                type="text"
                size="small"
                @click="resolveComment(comment.id)"
              >
                标记为已解决
              </a-button>
              <a-button
                v-else
                type="text"
                size="small"
                @click="activateComment(comment.id)"
              >
                重新激活
              </a-button>
              <a-button
                type="text"
                size="small"
                @click="editComment(comment)"
              >
                编辑
              </a-button>
              <a-popconfirm
                content="确定要删除这条评论吗？"
                @ok="deleteComment(comment.id)"
              >
                <a-button type="text" size="small" status="danger">
                  删除
                </a-button>
              </a-popconfirm>
            </div>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <div class="comment-meta">
            <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            <a-button
              v-if="comment.anchor"
              type="text"
              size="small"
              @click="jumpToAnchor(comment.anchor)"
            >
              定位到位置
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑评论对话框 -->
    <a-modal
      v-model:visible="showCreateDialog"
      :title="editingComment ? '编辑评论' : '添加评论'"
      :width="500"
      @ok="handleSaveComment"
      @cancel="cancelEdit"
    >
      <a-form :model="commentForm" layout="vertical">
        <a-form-item label="评论内容" field="content">
          <a-textarea
            v-model="commentForm.content"
            placeholder="请输入评论内容"
            :rows="4"
            :max-length="500"
            show-word-limit
          />
        </a-form-item>
        <a-form-item label="锚点位置（可选）" field="anchor">
          <a-input
            v-model="commentForm.anchor"
            placeholder="例如：line-10 或 section-1"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconPlus
} from '@arco-design/web-vue/es/icon'
import api from '../api/index'

const props = defineProps({
  documentId: {
    type: [String, Number],
    required: true
  },
  visible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['jump-to-anchor'])

const comments = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const editingComment = ref(null)

const commentForm = ref({
  content: '',
  anchor: ''
})

const loadComments = async () => {
  if (!props.documentId) return
  loading.value = true
  try {
    const res = await api.documentCommentApi.getCommentsByDocumentId(props.documentId)
    comments.value = res.data || []
  } catch (error) {
    Message.error('加载评论失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSaveComment = async () => {
  if (!commentForm.value.content.trim()) {
    Message.warning('请输入评论内容')
    return
  }

  try {
    const data = {
      documentId: props.documentId,
      content: commentForm.value.content,
      anchor: commentForm.value.anchor || null
    }

    if (editingComment.value) {
      await api.documentCommentApi.updateComment(editingComment.value.id, data)
      Message.success('评论更新成功')
    } else {
      await api.documentCommentApi.createComment(data)
      Message.success('评论创建成功')
    }

    showCreateDialog.value = false
    cancelEdit()
    loadComments()
  } catch (error) {
    Message.error(editingComment.value ? '更新评论失败' : '创建评论失败')
    console.error(error)
  }
}

const editComment = (comment) => {
  editingComment.value = comment
  commentForm.value = {
    content: comment.content,
    anchor: comment.anchor || ''
  }
  showCreateDialog.value = true
}

const cancelEdit = () => {
  editingComment.value = null
  commentForm.value = {
    content: '',
    anchor: ''
  }
}

const resolveComment = async (id) => {
  try {
    await api.documentCommentApi.updateCommentStatus(id, 'RESOLVED')
    Message.success('评论已标记为已解决')
    loadComments()
  } catch (error) {
    Message.error('操作失败')
    console.error(error)
  }
}

const activateComment = async (id) => {
  try {
    await api.documentCommentApi.updateCommentStatus(id, 'ACTIVE')
    Message.success('评论已重新激活')
    loadComments()
  } catch (error) {
    Message.error('操作失败')
    console.error(error)
  }
}

const deleteComment = async (id) => {
  try {
    await api.documentCommentApi.deleteComment(id)
    Message.success('评论已删除')
    loadComments()
  } catch (error) {
    Message.error('删除失败')
    console.error(error)
  }
}

const jumpToAnchor = (anchor) => {
  emit('jump-to-anchor', anchor)
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

watch(() => props.documentId, () => {
  loadComments()
}, { immediate: true })

onMounted(() => {
  loadComments()
})
</script>

<style scoped lang="scss">
.comment-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e5e7eb;
}

.comment-header {
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

.comment-list {
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

.comment-item {
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;

  &.resolved {
    opacity: 0.7;
    background: #f0f0f0;
  }
}

.comment-header-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 8px;

  .author-name {
    font-weight: 500;
    font-size: 14px;
  }
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.comment-content {
  margin-bottom: 12px;
  color: #1d2129;
  line-height: 1.6;
  font-size: 14px;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #86909c;
}

.comment-time {
  color: #86909c;
}
</style>

