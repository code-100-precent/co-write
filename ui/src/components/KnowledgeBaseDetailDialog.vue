<template>
  <a-modal
    v-model:visible="isVisible"
    title="知识库详情"
    :width="900"
    :footer="false"
    @cancel="closeDialog"
    unmount-on-close
  >
    <a-tabs default-active-key="info">
      <a-tab-pane key="info" title="基本信息">
        <div class="kb-info">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="知识库名称">
              {{ knowledgeBase?.name }}
            </a-descriptions-item>
            <a-descriptions-item label="描述">
              {{ knowledgeBase?.description || '无' }}
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatTime(knowledgeBase?.createdAt) }}
            </a-descriptions-item>
            <a-descriptions-item label="更新时间">
              {{ formatTime(knowledgeBase?.updatedAt) }}
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </a-tab-pane>
      <a-tab-pane key="collaborators" title="协作者">
        <KnowledgeBaseCollaboratorPanel
          v-if="knowledgeBase?.id"
          :knowledgeBaseId="knowledgeBase.id"
        />
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import KnowledgeBaseCollaboratorPanel from './KnowledgeBaseCollaboratorPanel.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  knowledgeBase: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const isVisible = ref(props.visible)

watch(() => props.visible, (val) => {
  isVisible.value = val
})

watch(() => isVisible.value, (val) => {
  if (!val) {
    emit('close')
  }
})

const closeDialog = () => {
  isVisible.value = false
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped lang="scss">
.kb-info {
  padding: 16px 0;
}
</style>

