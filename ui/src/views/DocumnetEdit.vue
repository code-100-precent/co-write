<template>
  <div class="editor-wrapper" :class="{ 'hide-native-cursor': isCollabMode }">
    <div
        v-for="(cursor, uid) in remoteCursors"
        :key="uid"
        class="custom-cursor"
        :style="{
      top: cursor.y + 'px',
      left: cursor.x + 'px',
      borderColor: cursor.color
    }"
    >
      <span class="cursor-label" :style="{ backgroundColor: cursor.color }">{{ uid }}</span>
    </div>
    <div class="toolbar">
      <div class="toolbar-left">
        <label class="toolbar-label">Editor Mode：</label>
        <Select
            v-model="editorStatus"
            :options="editorModes"
            placeholder="选择模式"
            style="z-index: 1999"
        />
        <button class="icon-toggle" @click="toggleToc" :title="showToc ? '隐藏目录' : '显示目录'">
          <component :is="showToc ? EyeOff : Eye" class="icon" />
        </button>

      </div>
      <div class="toolbar-right">
        <OnlineUsersPanel
            v-if="isCollabMode && onlineUsers.length > 0"
            :users="onlineUsers"
            :self="userInfo.username"
        />
        <button
            v-if="isCollabMode"
            class="action-btn"
            @click="inviteFriend"
        >
          邀请好友
        </button>
        <button
            class="action-btn secondary"
            :class="{ active: isCollabMode }"
            @click="toggleCollab"
        >
          {{ isCollabMode ? '退出协同' : '开启协同' }}
        </button>
        <button class="action-btn" @click="handleSave">保存</button>
        <button class="action-btn" @click="showShareDialog = true">分享</button>
        <button class="action-btn" @click="showPermissionDialog = true">权限</button>
        <button class="action-btn" @click="showAuditDialog = true">审计</button>
        <button class="action-btn" @click="showCommentPanel = !showCommentPanel">
          {{ showCommentPanel ? '隐藏评论' : '显示评论' }}
        </button>
      </div>
    </div>
    <div class="doc-title-input">
      <Input
          v-model="docTitle"
          placeholder="请输入文档标题"
          @blur="() => triggerSave('title-blur')"
          id="doc-title"
          :disabled="isCollabMode"
      />
    </div>
    <div class="tag-selector-wrapper" v-if="docId">
      <TagSelector :documentId="Number(docId)" v-model="selectedTags" />
    </div>
    <div class="editor-layout">
      <div class="editor-container">
        <MdEditor v-model="textContent" @change="onMdChange" style="height: 100%; width: 100%;"/>
      </div>
      <div v-if="showCommentPanel && docId" class="comment-panel-wrapper">
        <DocumentCommentPanel
          :documentId="Number(docId)"
          @jump-to-anchor="handleJumpToAnchor"
        />
      </div>
    </div>
    <button
      v-if="docId"
      class="comment-toggle-btn"
      @click="showCommentPanel = !showCommentPanel"
      :class="{ active: showCommentPanel }"
    >
      {{ showCommentPanel ? '×' : '💬' }}
    </button>
    <div v-if="showSuggestion" class="ai-suggestion-popup fixed-bottom-left">
      <pre>{{ suggestion }}</pre>
      <div class="hint-text">按 Tab 键接受</div>
    </div>

    <div
        v-if="isCollabMode"
        class="custom-cursor"
        :style="{
    top: cursor.y + 'px',
    left: cursor.x + 'px',
    borderColor: userColor,
  }"
    >
      <span class="cursor-label" :style="{ backgroundColor: userColor }">{{ userName }}</span>
    </div>
  </div>
  
  <!-- 分享对话框 -->
  <DocumentShareDialog
    :visible="showShareDialog"
    :documentId="docId"
    @close="showShareDialog = false"
  />

  <!-- 权限管理对话框 -->
  <DocumentPermissionDialog
    :visible="showPermissionDialog"
    :documentId="docId"
    @close="showPermissionDialog = false"
  />

  <!-- 审计日志对话框 -->
  <AuditLogDialog
    :visible="showAuditDialog"
    :documentId="docId"
    @close="showAuditDialog = false"
  />

  <!-- 分享口令验证对话框 -->
  <SharePasswordDialog
    :visible="showPasswordDialog"
    :shareCode="shareCode"
    @close="showPasswordDialog = false"
    @success="handlePasswordSuccess"
  />
  
  <SystemToast ref="toastRef" />
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {Eye, EyeOff} from 'lucide-vue-next'
import {useRoute} from 'vue-router'
import api from '../api/index'
import Input from '../components/Input.vue'
import OnlineUsersPanel from '../components/OnlineUsersPanel.vue'
import {MdEditor} from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import Select from '../components/Select.vue'
import {useAuth} from '../composables/useAuth'
import SystemToast from '../components/SystemToast.vue'
import DocumentShareDialog from '../components/DocumentShareDialog.vue'
import DocumentPermissionDialog from '../components/DocumentPermissionDialog.vue'
import AuditLogDialog from '../components/AuditLogDialog.vue'
import SharePasswordDialog from '../components/SharePasswordDialog.vue'
import DocumentCommentPanel from '../components/DocumentCommentPanel.vue'
import TagSelector from '../components/TagSelector.vue'

const route = useRoute()
const prevContent = ref('')
const opHistory = ref<EditorOperation[]>([])
const textContent = ref('')
const docTitle = ref('') // 文档标题内容
const docId = ref(route.query.id as string || '')
const isComposing = ref(false)
let imeBaseline = ''
const suggestion = ref('')
const showSuggestion = ref(false)
const suggestionPosition = ref({ bottom: 0, left: 0 })

// 对话框状态
const showShareDialog = ref(false)
const showPermissionDialog = ref(false)
const showAuditDialog = ref(false)
const showPasswordDialog = ref(false)
const shareCode = ref('')
const showCommentPanel = ref(false)
const selectedTags = ref([])

function applySuggestion() {
  textContent.value = textContent.value + suggestion.value
  showSuggestion.value = false
}

async function requestCompletion() {
  const code = textContent.value
  try {
    const response = await fetch(`http://localhost:8083/prompt/completion?code=${encodeURIComponent(code)}&language=Java`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    suggestion.value = response.suggestion
    showSuggestion.value = true
    updateSuggestionPosition()
  } catch (e) {
    console.error('AI 补全失败', e)
  }
}

function updateSuggestionPosition() {
  // 简单放在光标右下角（优化可用 cursor 坐标或编辑器内 API）
  suggestionPosition.value = {
    bottom: 10,
    left: 10
  }
}
let lastSaved = { title: '', content: '' }
const onlineUsers = ref<string[]>([])

function onMdChange(text: string) {
  if (isComposing.value) {
    return
  }
  if (skipNextChange) {
    skipNextChange = false
    return
  }
  if (!isCollabMode.value) {
    prevContent.value = text
    return
  }
  if (text === '') {
    console.log(text, text, text)
    return
  }
  const ops = getDiffOps(prevContent.value, text)
  prevContent.value = text
  if (ops.length > 0) {
    console.log('Detected diff operations:', ops)
    opHistory.value.push(...ops)  // 保存记录
    const firstOp = ops[0]
    const payload = {
      operationType: firstOp.type === 'insert' ? 'CONTENT_INSERT' : 'CONTENT_DELETE',
      // docId: docId.value,
      docId: 1,
      length: firstOp.length || 0,
      userId: userInfo.value.username,
      pos: firstOp.pos,
      content: firstOp.text || '',
      x: cursor.value.x,
      y: cursor.value.y,
      timestamp: firstOp.timestamp,
      isTyping: true,
    }
    sendWSMessage(payload)
  }
}

interface EditorOperation {
  type: 'insert' | 'delete',
  pos: number,
  length?: number,     // 删除长度
  text?: string,       // 插入文本
  timestamp: number,
  userId: string,
  docId: number,
}

function getDiffOps(oldText: string, newText: string): EditorOperation[] {
  const ops: EditorOperation[] = []
  const timestamp = Date.now()
  const minLen = Math.min(oldText.length, newText.length)
  let start = 0
  while (start < minLen && oldText[start] === newText[start]) {
    start++
  }
  let endOld = oldText.length - 1
  let endNew = newText.length - 1
  while (endOld >= start && endNew >= start && oldText[endOld] === newText[endNew]) {
    endOld--
    endNew--
  }
  const deleted = oldText.slice(start, endOld + 1)
  const inserted = newText.slice(start, endNew + 1)
  if (deleted.length > 0) {
    ops.push({
      type: 'delete',
      pos: start,
      length: deleted.length,
      timestamp,
      userId: userInfo.value.username,
      docId: 1
      // docId: docId.value
    })
  }
  if (inserted.length > 0) {
    ops.push({
      type: 'insert',
      pos: start,
      text: inserted,
      timestamp: timestamp,
      userId: userInfo.value.username,
      // docId: docId.value
      docId: 1,
    })
  }
  return ops
}

function inviteFriend() {
  const url = window.location.href
  navigator.clipboard.writeText(url)
}

async function triggerSave(latestOp = 'manual') {
  if (!docId.value) return;
  const payload = {
    title: (docTitle.value || '').trim(),
    content: (textContent.value || '').trim(),
    latestOp,
  };
  if (!payload.title || !payload.content) return;
  if (
      payload.title === lastSaved.title &&
      payload.content === lastSaved.content
  ) return;
  try {
    await api.documentApi.saveContent(docId.value, payload)
    lastSaved = { ...payload }
    console.log('自动保存成功', latestOp)
  } catch (err) {
    console.error('保存失败', err)
  }
}

onMounted(async () => {
  const id = route.query.id as string
  if (id) {
    try {
      const res = await api.documentApi.getLatestContent(id)
      console.log(res)
      textContent.value = res.data.content;
      docTitle.value = res.data.title;
    } catch (e) {
      textContent.value = '加载文档失败'
      console.error(e)
    }
  }
  const title = route.query.title as string
  if (title){
    try{
      docTitle.value = title
    }catch (e) {
      docTitle.value = '加载文档失败'
      console.error(e)
    }
  }
  window.addEventListener('keydown', onKeyDown);
})

const { getUserInfo } = useAuth()
const userInfo = getUserInfo
const editorStatus = ref<'view' | 'edit' | 'all'>('edit')
const toastRef = ref<InstanceType<typeof SystemToast> | null>(null)
const remoteCursors = ref<Record<string, { x: number; y: number; color: string }>>({})
const editorModes = [
  { value: 'view', label: '仅查看' },
  { value: 'edit', label: '编辑模式' },
  { value: 'all', label: '全部显示' },
]

const isCollabMode = ref(false)
function toggleCollab() {
  isCollabMode.value = !isCollabMode.value
  if (isCollabMode.value) {
    initWebSocket()
  } else {
    closeWebSocket()
  }
  console.log(`协同模式 ${isCollabMode.value ? '开启' : '关闭'}`)
}
const showToc = ref(false)
function toggleToc() {
  showToc.value = !showToc.value
}
function handleSave() {
  triggerSave('click-save')
}
function handleShare() {
  showShareDialog.value = true
}

function handlePasswordSuccess(data: any) {
  // 口令验证成功，可以访问文档
  console.log('口令验证成功:', data)
  showPasswordDialog.value = false
}

function handleJumpToAnchor(anchor: string) {
  // 跳转到锚点位置
  if (anchor) {
    const element = document.querySelector(`[data-anchor="${anchor}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('highlight-anchor')
      setTimeout(() => {
        element.classList.remove('highlight-anchor')
      }, 2000)
    }
  }
}
onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('compositionstart', onCompositionStart, true)
  window.addEventListener('compositionend', onCompositionEnd, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('compositionstart', onCompositionStart, true)
  window.removeEventListener('compositionend', onCompositionEnd, true)
})

function onCompositionStart() {
  if (!isComposing.value) {
    isComposing.value = true
    imeBaseline = prevContent.value || textContent.value
  }
}

function onCompositionEnd() {
  isComposing.value = false
  const latest = textContent.value
  if (!isCollabMode.value) {
    prevContent.value = latest
    return
  }

  const ops = getDiffOps(imeBaseline, latest)
  prevContent.value = latest
  if (ops.length > 0) {
    const firstOp = ops[0]
    const payload = {
      operationType: firstOp.type === 'insert' ? 'CONTENT_INSERT' : 'CONTENT_DELETE',
      docId: 1,
      length: firstOp.length || 0,
      userId: userInfo.value.username,
      pos: firstOp.pos,
      content: firstOp.text || '',
      x: cursor.value.x,
      y: cursor.value.y,
      timestamp: firstOp.timestamp,
      isTyping: true,
    }
    sendWSMessage(payload)
  }
}
function onKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    triggerSave('ctrl-s')
  }
  if (e.key === 'Tab' && showSuggestion.value && suggestion.value) {
    e.preventDefault()
    applySuggestion()
  }

  if (e.key === 'A') {
    e.preventDefault()
    requestCompletion()
  }
}

const userName = userInfo.value.username
const cursor = ref({ x: 0, y: 0 })

function getColorByName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 80%, 60%)`
}

const userColor = getColorByName(userName)

function throttle<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let lastCall = 0
  return function (...args: any[]) {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  } as T
}

function rawMouseMoveHandler(e: MouseEvent) {
  if (!isCollabMode.value) return

  cursor.value = { x: e.clientX, y: e.clientY }

  const payload = {
    operationType: 'MOUSE_MOVE',
    docId: 1,
    userId: userInfo.value.username,
    x: e.clientX,
    y: e.clientY,
    timestamp: Date.now(),
    isTyping: false,
  }

  sendWSMessage(payload)
}

const throttledMouseMove = throttle(rawMouseMoveHandler, 35)  // 每 100ms 最多发送一次

onMounted(() => {
  window.addEventListener('mousemove', throttledMouseMove)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', throttledMouseMove)
  remoteCursors.value = {}
  if (socket.value) {
    const payload = {
      operationType: 'USER_OFFLINE',
      // docId: docId.value,
      docId: 1,
      userId: userInfo.value.username,
      x: 255,
      y: 255,
      timestamp: Date.now(),
      isTyping: false,
    }

    sendWSMessage(payload)
    socket.value.close()
  }
})

const socket = ref<WebSocket | null>(null)

function closeWebSocket() {
  remoteCursors.value = {}
  if (socket.value) {
    try {
      if (
          socket.value.readyState === WebSocket.OPEN ||
          socket.value.readyState === WebSocket.CONNECTING
      ) {
        const payload = {
          operationType: 'USER_OFFLINE',
          // docId: docId.value,
          docId: 1,
          userId: userInfo.value.username,
          x: 255,
          y: 255,
          timestamp: Date.now(),
          isTyping: false,
        }
        sendWSMessage(payload)
        socket.value.close()
      }
    } catch (e) {
      console.warn('关闭 WebSocket 出错', e)
    } finally {
      socket.value = null
    }
  }
}

function initWebSocket() {
  const wsUrl = `ws://127.0.0.1:8081/ws`
  if (socket.value && socket.value.readyState === WebSocket.OPEN) return
  if (socket.value && socket.value.readyState === WebSocket.CONNECTING) return
  socket.value = new WebSocket(wsUrl)
  socket.value.onopen = () => {
    const payload = {
      operationType: 'USER_ONLINE',
      // docId: docId.value,
      docId: 1,
      userId: userInfo.value.username,
      x: 255,
      y: 255,
      timestamp: Date.now(),
      isTyping: false,
    }

    sendWSMessage(payload)
    console.log('WebSocket connected')
  }
  socket.value.onclose = () => {
    console.warn('WebSocket disconnected')
  }
  socket.value.onerror = (err) => {
    console.error('WebSocket error', err)
  }
  socket.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'USER_ONLINE' && data.payload?.onlineusers) {
      onlineUsers.value = data.payload.onlineusers
      toastRef.value?.addMessage(`${data.payload.message} 上线了`)
    }
    if (data.type === 'USER_ONLINE' && data.payload?.onlineusers) {
      onlineUsers.value = data.payload.onlineusers
      toastRef.value?.addMessage(`${data.payload.message} 下线了`)
    }
    if (data.type === 'MOUSE_MOVE') {
      console.log('到这里', data.payload)
      const { x, y } = data.payload
      const userId = data.userId
      if (userId !== userInfo.value.username) { // 排除自己
        remoteCursors.value[userId] = {
          x,
          y,
          color: getColorByName(userId)
        }
      }
    }
    if (data.type === 'CONTENT_INSERT' || data.type === 'CONTENT_DELETE') {
      applyRemoteOperation(data) // 执行插入或删除
      return
    }
    console.log('Received message:', event.data)
  }
}

let skipNextChange = false
interface TextOp {
  type: 'CONTENT_INSERT' | 'CONTENT_DELETE'
  pos: number
  content?: string
  length?: number
}
const pendingLocalOps: TextOp[] = []

function transform(remote: TextOp, local: TextOp): TextOp {
  const op = { ...remote }
  if (local.type === 'CONTENT_INSERT') {
    if (local.pos <= op.pos) {
      op.pos += (local.content?.length ?? 0)
    }
  } else { // local delete
    if (local.pos < op.pos) {
      op.pos -= Math.min(local.length ?? 0, op.pos - local.pos)
    }
  }
  return op
}

function applyRemoteOperation(msg: any) {
  let remoteOp: TextOp = {
    type: msg.type,
    pos: msg.payload.pos,
    content: msg.payload.content,
    length: msg.payload.length
  }
  pendingLocalOps.forEach(local => {
    remoteOp = transform(remoteOp, local)
  })
  applyToView(remoteOp)
}

function applyToView(op: TextOp) {
  const cur = textContent.value || ''
  const p = Math.max(0, Math.min(op.pos, cur.length))

  let next: string
  if (op.type === 'CONTENT_INSERT') {
    next = cur.slice(0, p) + (op.content ?? '') + cur.slice(p)
  } else {
    const l = op.length ?? 0
    next = cur.slice(0, p) + cur.slice(p + l)
  }

  skipNextChange = true
  textContent.value = next
}
function sendWSMessage(payload: any) {
  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    console.log('sendWSMessage', payload)
    socket.value.send(JSON.stringify(payload))
  }
}
</script>

<style scoped lang="scss">
.editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
  background: #f9fafb;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toolbar-label {
  font-weight: 350;
  font-size: 0.75rem;
}

.action-btn {
  padding: 0.35rem 0.35rem;
  border: none;
  background-color: #0ea5e9;
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
}
.action-btn:hover {
  background-color: #0284c7;
}
.action-btn.secondary {
  background-color: #64748b;
}
.action-btn.secondary:hover {
  background-color: #475569;
}

.editor-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 16px;
}

.editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid #ddd;
  background-color: white;
  display: flex;
}

.comment-panel-wrapper {
  width: 350px;
  min-height: 0;
  border-radius: 0.75rem;
  border: 1px solid #ddd;
  background-color: white;
  overflow: hidden;
}

.tag-selector-wrapper {
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.comment-toggle-btn {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #0ea5e9;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  z-index: 1000;

  &:hover {
    background-color: #0284c7;
    transform: scale(1.1);
  }

  &.active {
    background-color: #64748b;
  }

  .icon {
    width: 24px;
    height: 24px;
  }
}

.highlight-anchor {
  background-color: #fef3c7 !important;
  transition: background-color 0.3s;
}

.icon-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
}

.icon-toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #0f172a;
}

.doc-title-input {
  width: 96%;
  margin-bottom: 1rem;
}

.doc-title {
  width: 80%;
}

.custom-cursor {
  position: fixed;
  width: 10px;
  height: 10px;
  border: 2px solid;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
}

.cursor-label {
  position: absolute;
  top: -24px;
  left: 0;
  padding: 2px 6px;
  font-size: 12px;
  color: white;
  border-radius: 4px;
  white-space: nowrap;
}

.hide-native-cursor,
.hide-native-cursor * {
  cursor: none !important;
}

.ai-suggestion-popup {
  position: fixed;
  background: #fff;
  border: 1px solid #ccc;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 400px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 3000;
}

.hint-text {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.fixed-bottom-left {
  position: absolute;
  bottom: 12px;
  left: 12px;
}
</style>