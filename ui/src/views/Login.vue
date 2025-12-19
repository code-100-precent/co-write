<template>
  <div class="login-wrapper">
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>
    <transition name="fade">
      <a-card class="login-card" :bordered="false">
        <template #title>
          <h1 class="logo">CoWrite</h1>
        </template>

        <!-- 登录方式切换 -->
        <a-radio-group
            v-model="loginMode"
            type="button"
            class="tab-selector"
            @change="switchLoginMode"
        >
          <a-radio value="code">
            <MailIcon class="icon" />
            验证码登录
          </a-radio>
          <a-radio value="password">
            <LockIcon class="icon" />
            密码登录
          </a-radio>
        </a-radio-group>

        <transition name="slide-fade" mode="out-in">
          <a-form
              :key="loginMode"
              :model="formData"
              @submit="handleLogin"
              layout="vertical"
              class="login-form"
              :required-symbol="false"
          >
            <a-form-item
                field="email"
                label=""
                :rules="[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]"
                :validate-trigger="['blur']"
            >
              <a-input
                  v-model="formData.email"
                  placeholder="请输入邮箱"
                  size="large"
                  allow-clear
              >
                <template #prefix>
                  <MailIcon class="icon" />
                </template>
              </a-input>
            </a-form-item>

            <!-- 验证码登录 -->
            <a-form-item
                v-if="loginMode === 'code'"
                field="code"
                label=""
                :rules="[
                  { required: true, message: '请输入验证码' },
                  { length: 6, message: '验证码必须为6位数字' },
                  { match: /^\d{6}$/, message: '验证码只能包含数字' }
                ]"
                :validate-trigger="['blur']"
            >
              <a-input-group>
                <a-input
                    v-model="formData.code"
                    placeholder="请输入验证码"
                    size="large"
                    maxlength="6"
                    allow-clear
                >
                  <template #prefix>
                    <LockIcon class="icon" />
                  </template>
                </a-input>
                <a-button
                    type="primary"
                    size="large"
                    :disabled="codeCooldown > 0 || !formData.email"
                    @click="sendCode"
                    :loading="sendingCode"
                >
                  <template v-if="codeCooldown > 0">
                    {{ codeCooldown }}s
                  </template>
                  <template v-else>
                    发送验证码
                  </template>
                </a-button>
              </a-input-group>
            </a-form-item>

            <!-- 密码登录 -->
            <a-form-item
                v-else
                field="password"
                label=""
                :rules="[
                  { required: true, message: '请输入密码' }
                ]"
                :validate-trigger="['blur']"
            >
              <a-input-password
                  v-model="formData.password"
                  placeholder="请输入密码"
                  size="large"
                  allow-clear
              >
                <template #prefix>
                  <LockIcon class="icon" />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item>
              <a-button
                  type="primary"
                  html-type="submit"
                  size="large"
                  long
                  :loading="loading"
                  class="submit-button"
              >
                <template v-if="!loading">登录</template>
                <template v-else>登录中...</template>
              </a-button>
            </a-form-item>
            <div class="forgot-password-row">
              <a-link @click="showRegisterDialog = true">注册新用户</a-link>
              <a-link @click="onForgotPassword">忘记密码？</a-link>
            </div>
          </a-form>
        </transition>

        <a-divider>或</a-divider>

        <a-button
            type="outline"
            size="large"
            long
            @click="loginWithGitHub"
            class="github-button"
        >
          <template #icon>
            <GithubIcon class="icon" />
          </template>
          GitHub 登录
        </a-button>
      </a-card>
    </transition>

    <!-- 注册对话框 -->
    <a-modal
      v-model:visible="showRegisterDialog"
      title="注册新用户"
      :width="500"
      @ok="handleRegister"
      @cancel="cancelRegister"
    >
      <a-form :model="registerForm" layout="vertical" ref="registerFormRef">
        <a-form-item
          field="email"
          label="邮箱"
          :rules="[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]"
        >
          <a-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            size="large"
            allow-clear
          >
            <template #prefix>
              <MailIcon class="icon" />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          field="code"
          label="验证码"
          :rules="[
            { required: true, message: '请输入验证码' },
            { length: 6, message: '验证码必须为6位数字' },
            { match: /^\d{6}$/, message: '验证码只能包含数字' }
          ]"
        >
          <a-input-group>
            <a-input
              v-model="registerForm.code"
              placeholder="请输入验证码"
              size="large"
              maxlength="6"
              allow-clear
            >
              <template #prefix>
                <LockIcon class="icon" />
              </template>
            </a-input>
            <a-button
              type="primary"
              size="large"
              :disabled="registerCodeCooldown > 0 || !registerForm.email"
              @click="sendRegisterCode"
              :loading="sendingRegisterCode"
            >
              <template v-if="registerCodeCooldown > 0">
                {{ registerCodeCooldown }}s
              </template>
              <template v-else>
                发送验证码
              </template>
            </a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item
          field="password"
          label="密码"
          :rules="[
            { required: true, message: '请输入密码' },
            { minLength: 6, message: '密码长度至少6位' }
          ]"
        >
          <a-input-password
            v-model="registerForm.password"
            placeholder="请输入密码（至少6位）"
            size="large"
            allow-clear
          >
            <template #prefix>
              <LockIcon class="icon" />
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item
          field="confirmPassword"
          label="确认密码"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validateRegisterConfirmPassword }
          ]"
        >
          <a-input-password
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            size="large"
            allow-clear
          >
            <template #prefix>
              <LockIcon class="icon" />
            </template>
          </a-input-password>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  MailIcon,
  UserIcon,
  GithubIcon,
  LockIcon,
} from 'lucide-vue-next'
import { Message } from '@arco-design/web-vue'

import api from '../api/index.js';
const router = useRouter()
import { useAuth } from '../composables/useAuth'
const { setToken, setUserInfo } = useAuth()

const loginMode = ref<'code' | 'password'>('code')
const formData = reactive({
  email: '2148582258@qq.com',
  code: '',
  password: '',
})
const loading = ref(false)
const sendingCode = ref(false)
const codeCooldown = ref(0)
let timer: any = null

const showRegisterDialog = ref(false)
const registerForm = reactive({
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
})
const sendingRegisterCode = ref(false)
const registerCodeCooldown = ref(0)
let registerTimer: any = null
const registerFormRef = ref()

const bgCanvas = ref<HTMLCanvasElement | null>(null)
let rafId = 0 as number
let particles: { x: number; y: number; r: number; vx: number; vy: number; color: string }[] = []

const initBackground = () => {
  const canvas = bgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()

  // 生成柔和渐变气泡
  const colors = ['#e0f2fe', '#e9d5ff', '#dbeafe', '#ffe4e6']
  const count = Math.min(24, Math.floor((canvas.width * canvas.height) / 90000))
  particles = Array.from({ length: count }).map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: 40 + Math.random() * 80,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }))

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // 背景渐变
    const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grd.addColorStop(0, '#ffffff')
    grd.addColorStop(1, '#f6f7fb')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      if (p.x - p.r < 0 || p.x + p.r > canvas.width) p.vx *= -1
      if (p.y - p.r < 0 || p.y + p.r > canvas.height) p.vy *= -1

      const radial = ctx.createRadialGradient(p.x, p.y, p.r * 0.2, p.x, p.y, p.r)
      radial.addColorStop(0, p.color)
      radial.addColorStop(1, 'rgba(255,255,255,0.6)')
      ctx.fillStyle = radial
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    })

    rafId = requestAnimationFrame(draw)
  }

  const onResize = () => {
    resize()
  }
  window.addEventListener('resize', onResize)

  draw()

  return () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
  }
}

onMounted(() => {
  const cleanup = initBackground()
  // 存在时在卸载清理
  onUnmounted(() => {
    if (cleanup) cleanup()
  })
})

// 发送注册验证码
const sendRegisterCode = async () => {
  if (!registerForm.email) {
    Message.warning('请输入邮箱')
    return
  }
  try {
    sendingRegisterCode.value = true
    await api.userApi.sendVerificationCode(registerForm.email)

    registerCodeCooldown.value = 60
    registerTimer = setInterval(() => {
      if (registerCodeCooldown.value > 0) {
        registerCodeCooldown.value--
      } else {
        clearInterval(registerTimer)
      }
    }, 1000)
    Message.success('验证码已发送')
  } catch (e: any) {
    Message.error(e.message || '发送失败')
  } finally {
    sendingRegisterCode.value = false
  }
}

// 验证注册确认密码
const validateRegisterConfirmPassword = (value: string, callback: (error?: string) => void) => {
  if (!value) {
    callback('请确认密码')
  } else if (value !== registerForm.password) {
    callback('两次输入的密码不一致')
  } else {
    callback()
  }
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
    
    if (!registerForm.email || !registerForm.code || !registerForm.password || !registerForm.confirmPassword) {
      Message.warning('请填写完整信息')
      return
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      Message.warning('两次输入的密码不一致')
      return
    }
    
    loading.value = true
    const registerData = await api.userApi.register({
      email: registerForm.email,
      code: registerForm.code,
      password: registerForm.password
    })

    if (registerData.data?.token) {
      setToken(registerData.data.token)
      setUserInfo({
        username: registerData.data.username,
        email: registerData.data.email,
        avatarUrl: registerData.data.avatarUrl,
        bio: registerData.data.bio,
        language: registerData.data.language,
        themeDark: registerData.data.themeDark,
        status: registerData.data.status
      })
      Message.success('注册成功，正在跳转...')
      showRegisterDialog.value = false
      cancelRegister()
      router.push('/')
    } else {
      Message.error(registerData.message || '注册失败')
    }
  } catch (err: any) {
    if (err.errors) {
      // 表单验证错误
      return
    }
    Message.error(err.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 取消注册
const cancelRegister = () => {
  registerForm.email = ''
  registerForm.code = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  if (registerCodeCooldown.value > 0) {
    clearInterval(registerTimer)
    registerCodeCooldown.value = 0
  }
}

// 切换登录方式
const switchLoginMode = (value: string) => {
  loginMode.value = value as 'code' | 'password'
  // 切换时清空表单
  formData.code = ''
  formData.password = ''
  if (codeCooldown.value > 0) {
    clearInterval(timer)
    codeCooldown.value = 0
  }
}

// 发送验证码
const sendCode = async () => {
  if (!formData.email) {
    Message.warning('请输入邮箱')
    return
  }
  try {
    sendingCode.value = true
    await api.userApi.sendVerificationCode(formData.email)

    codeCooldown.value = 60
    timer = setInterval(() => {
      if (codeCooldown.value > 0) {
        codeCooldown.value--
      } else {
        clearInterval(timer)
      }
    }, 1000)
    Message.success('验证码已发送')
  } catch (e: any) {
    Message.error(e.message || '发送失败')
  } finally {
    sendingCode.value = false
  }
}

const handleLogin = async (data: { values: any; errors: any }) => {
  if (data.errors) {
    return
  }

  loading.value = true
  try {
    let response
    if (loginMode.value === 'code') {
      // 验证码登录
      if (!formData.email || !formData.code) {
        Message.warning('请填写邮箱和验证码')
        loading.value = false
        return
      }
      response = await api.userApi.loginByEmail({
        email: formData.email,
        code: formData.code
      })
    } else {
      // 密码登录
      if (!formData.email || !formData.password) {
        Message.warning('请填写邮箱和密码')
        loading.value = false
        return
      }
      response = await api.userApi.loginByPassword({
        email: formData.email,
        password: formData.password
      })
    }

    if (response.data?.token) {
      // 登录成功
      setToken(response.data.token)
      setUserInfo({
        username: response.data.username,
        email: response.data.email,
        avatarUrl: response.data.avatarUrl,
        bio: response.data.bio,
        language: response.data.language,
        themeDark: response.data.themeDark,
        status: response.data.status
      })
      Message.success('登录成功，正在跳转...')
      router.push('/')
    } else {
      Message.error(response.message || '登录失败')
    }
  } catch (err: any) {
    Message.error(err.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// GitHub 登录
const loginWithGitHub = () => {
  // 检查URL参数中是否有token（后端重定向回来的）
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const code = urlParams.get('code')
  
  if (token) {
    // 后端已经处理了OAuth，直接使用返回的token
    loading.value = true
    try {
      setToken(token)
      // 获取用户信息
      api.userApi.getUserInfo().then((res) => {
        if (res.data) {
          setUserInfo({
            username: res.data.username,
            email: res.data.email,
            avatarUrl: res.data.avatarUrl,
            bio: res.data.bio,
            language: res.data.language,
            themeDark: res.data.themeDark,
            status: res.data.status
          })
        }
        Message.success('GitHub登录成功，正在跳转...')
        router.push('/')
      }).catch(() => {
        // 即使获取用户信息失败，也尝试跳转
        router.push('/')
      }).finally(() => {
        loading.value = false
      })
    } catch (err: any) {
      Message.error('GitHub登录失败，请稍后重试')
      loading.value = false
    }
  } else {
    // 跳转到GitHub授权页面
    // 注意：需要配置实际的GitHub Client ID
    const clientId = 'YOUR_GITHUB_CLIENT_ID' // 应该从环境变量或配置中获取
    const redirectUri = encodeURIComponent('http://localhost:8080/api/users/oauth2/code/github')
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`
    window.location.href = githubAuthUrl
  }
}

// 页面加载时检查是否有GitHub回调
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('token')) {
    loginWithGitHub()
  }
})

// 忘记密码处理
const onForgotPassword = () => {
  Message.info({
    content: '请联系管理员重置密码或前往找回页面',
    duration: 3000
  })
}
</script>

<style scoped>
.login-wrapper {
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 60px rgba(16, 24, 40, 0.12);
  animation: scaleIn 0.4s ease;
}

:deep(.arco-card-body) {
  padding: 2.2rem;
}

:deep(.arco-card-header) {
  padding: 0 0 1.2rem 0;
  border-bottom: none;
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 登录方式切换动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

.logo {
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  text-align: center;
}


.tab-selector {
  width: 100%;
  margin-bottom: 1rem;
}

:deep(.tab-selector .arco-radio-group) {
  width: 100%;
  display: flex;
  gap: 0;
}

:deep(.tab-selector .arco-radio-button) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
}

:deep(.arco-radio-button .icon) {
  width: 16px;
  height: 16px;
}

.mode-block {
  transition: all 0.3s ease;
}

.login-form {
  margin-top: 1rem;
}

:deep(.login-form .arco-form-item) {
  margin-bottom: 1.2rem;
}

:deep(.login-form .arco-form-item-label) {
  display: none !important;
}

:deep(.login-form .arco-form-item-label-required) {
  display: none !important;
}

:deep(.login-form .arco-input-wrapper) {
  border-radius: 8px;
}

:deep(.login-form .arco-input-group) {
  display: flex;
  gap: 8px;
}

:deep(.login-form .arco-input-group .arco-input-wrapper) {
  flex: 1;
}

.forgot-password-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -0.8rem;
  margin-bottom: 0.5rem;
}

.submit-button {
  margin-top: 0.5rem;
  border-radius: 8px;
  font-weight: 600;
}

.github-button {
  border-radius: 8px;
  font-weight: 500;
}

.github-button .icon {
  width: 18px;
  height: 18px;
}

:deep(.arco-divider-text) {
  color: #86909c;
  font-size: 13px;
}

.register-tip {
  text-align: center;
  margin-top: 12px;
}

</style>
