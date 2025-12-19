<template>
  <div class="billing-management">
    <div class="page-header">
      <h2>账单管理</h2>
    </div>

    <a-tabs default-active-key="invoices">
      <a-tab-pane key="invoices" title="账单列表">
        <a-card>
          <div class="toolbar">
            <a-space>
              <a-select
                v-model="invoiceStatus"
                placeholder="筛选状态"
                style="width: 150px;"
                @change="loadInvoices"
              >
                <a-option value="">全部</a-option>
                <a-option value="PENDING">待支付</a-option>
                <a-option value="PAID">已支付</a-option>
                <a-option value="OVERDUE">已逾期</a-option>
              </a-select>
              <a-button type="primary" @click="showGenerateDialog = true">
                生成账单
              </a-button>
            </a-space>
          </div>

          <a-table
            :columns="invoiceColumns"
            :data="invoices"
            :loading="invoiceLoading"
            style="margin-top: 16px;"
          >
            <template #status="{ record }">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusName(record.status) }}
              </a-tag>
            </template>
            <template #amount="{ record }">
              ¥{{ record.amount || 0 }}
            </template>
            <template #operations="{ record }">
              <a-button
                type="text"
                size="small"
                @click="viewInvoiceDetail(record.id)"
              >
                查看详情
              </a-button>
              <a-button
                v-if="record.status === 'PENDING'"
                type="text"
                size="small"
                @click="handlePay(record)"
              >
                支付
              </a-button>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>

      <a-tab-pane key="alerts" title="预警配置">
        <a-card>
          <div class="toolbar">
            <a-button type="primary" @click="showAlertDialog = true">
              创建预警
            </a-button>
          </div>

          <a-table
            :columns="alertColumns"
            :data="alerts"
            :loading="alertLoading"
            style="margin-top: 16px;"
          >
            <template #operations="{ record }">
              <a-button type="text" size="small" @click="editAlert(record)">
                编辑
              </a-button>
              <a-popconfirm
                content="确定要删除这个预警吗？"
                @ok="handleDeleteAlert(record.id)"
              >
                <a-button type="text" size="small" status="danger">
                  删除
                </a-button>
              </a-popconfirm>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 生成账单对话框 -->
    <a-modal
      v-model:visible="showGenerateDialog"
      title="生成账单"
      :width="500"
      @ok="handleGenerateInvoice"
      @cancel="showGenerateDialog = false"
    >
      <a-form :model="generateForm" layout="vertical">
        <a-form-item label="账单类型" field="type">
          <a-radio-group v-model="generateForm.type">
            <a-radio value="monthly">月度账单</a-radio>
            <a-radio value="yearly">年度账单</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="年份" field="year">
          <a-input-number v-model="generateForm.year" :min="2020" :max="2099" />
        </a-form-item>
        <a-form-item v-if="generateForm.type === 'monthly'" label="月份" field="month">
          <a-input-number v-model="generateForm.month" :min="1" :max="12" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 账单详情对话框 -->
    <a-modal
      v-model:visible="showDetailDialog"
      title="账单详情"
      :width="600"
      :footer="false"
    >
      <div v-if="invoiceDetail" class="invoice-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="账单ID">
            {{ invoiceDetail.id }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusColor(invoiceDetail.status)">
              {{ getStatusName(invoiceDetail.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="金额">
            ¥{{ invoiceDetail.amount || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatTime(invoiceDetail.createdAt) }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>

    <!-- 预警配置对话框 -->
    <a-modal
      v-model:visible="showAlertDialog"
      :title="editingAlert ? '编辑预警' : '创建预警'"
      :width="500"
      @ok="handleSaveAlert"
      @cancel="cancelAlertEdit"
    >
      <a-form :model="alertForm" layout="vertical">
        <a-form-item label="预警类型" field="type">
          <a-select v-model="alertForm.type" placeholder="请选择预警类型">
            <a-option value="USAGE">用量预警</a-option>
            <a-option value="BILLING">账单预警</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="阈值" field="threshold">
          <a-input-number v-model="alertForm.threshold" :min="0" />
        </a-form-item>
        <a-form-item label="描述" field="description">
          <a-textarea v-model="alertForm.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import api from '../../api/index'
import { useAuth } from '../../composables/useAuth'

const { getUserInfo } = useAuth()
const userInfo = getUserInfo

const invoices = ref([])
const alerts = ref([])
const invoiceLoading = ref(false)
const alertLoading = ref(false)
const invoiceStatus = ref('')
const showGenerateDialog = ref(false)
const showDetailDialog = ref(false)
const showAlertDialog = ref(false)
const invoiceDetail = ref(null)
const editingAlert = ref(null)

const generateForm = ref({
  type: 'monthly',
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})

const alertForm = ref({
  type: 'USAGE',
  threshold: 0,
  description: ''
})

const invoiceColumns = [
  {
    title: '账单ID',
    dataIndex: 'id'
  },
  {
    title: '金额',
    dataIndex: 'amount',
    slotName: 'amount'
  },
  {
    title: '状态',
    dataIndex: 'status',
    slotName: 'status'
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

const alertColumns = [
  {
    title: '类型',
    dataIndex: 'type'
  },
  {
    title: '阈值',
    dataIndex: 'threshold'
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

const loadInvoices = async () => {
  if (!userInfo.value?.id) return
  invoiceLoading.value = true
  try {
    const res = await api.billingApi.getUserInvoices(
      userInfo.value.id,
      invoiceStatus.value || undefined
    )
    invoices.value = res.data || []
  } catch (error) {
    Message.error('加载账单失败')
    console.error(error)
  } finally {
    invoiceLoading.value = false
  }
}

const loadAlerts = async () => {
  if (!userInfo.value?.id) return
  alertLoading.value = true
  try {
    const res = await api.billingApi.getUserAlerts(userInfo.value.id)
    alerts.value = res.data || []
  } catch (error) {
    Message.error('加载预警配置失败')
    console.error(error)
  } finally {
    alertLoading.value = false
  }
}

const handleGenerateInvoice = async () => {
  if (!userInfo.value?.id) return
  try {
    if (generateForm.value.type === 'monthly') {
      await api.billingApi.generateMonthlyInvoice(
        userInfo.value.id,
        generateForm.value.year,
        generateForm.value.month
      )
    } else {
      await api.billingApi.generateYearlyInvoice(
        userInfo.value.id,
        generateForm.value.year
      )
    }
    Message.success('账单生成成功')
    showGenerateDialog.value = false
    loadInvoices()
  } catch (error) {
    Message.error('生成账单失败')
    console.error(error)
  }
}

const viewInvoiceDetail = async (id) => {
  try {
    const res = await api.billingApi.getInvoiceDetail(id)
    invoiceDetail.value = res.data
    showDetailDialog.value = true
  } catch (error) {
    Message.error('加载账单详情失败')
    console.error(error)
  }
}

const handlePay = async (invoice) => {
  try {
    await api.billingApi.payInvoice(invoice.id, invoice.amount)
    Message.success('支付成功')
    loadInvoices()
  } catch (error) {
    Message.error('支付失败')
    console.error(error)
  }
}

const handleSaveAlert = async () => {
  if (!userInfo.value?.id) return
  try {
    if (editingAlert.value) {
      await api.billingApi.updateAlert(editingAlert.value.id, {
        ...alertForm.value,
        userId: userInfo.value.id
      })
      Message.success('预警更新成功')
    } else {
      await api.billingApi.createAlert({
        ...alertForm.value,
        userId: userInfo.value.id
      })
      Message.success('预警创建成功')
    }
    showAlertDialog.value = false
    cancelAlertEdit()
    loadAlerts()
  } catch (error) {
    Message.error(editingAlert.value ? '更新预警失败' : '创建预警失败')
    console.error(error)
  }
}

const editAlert = (alert) => {
  editingAlert.value = alert
  alertForm.value = {
    type: alert.type,
    threshold: alert.threshold,
    description: alert.description || ''
  }
  showAlertDialog.value = true
}

const cancelAlertEdit = () => {
  editingAlert.value = null
  alertForm.value = {
    type: 'USAGE',
    threshold: 0,
    description: ''
  }
}

const handleDeleteAlert = async (id) => {
  try {
    await api.billingApi.deleteAlert(id)
    Message.success('预警已删除')
    loadAlerts()
  } catch (error) {
    Message.error('删除失败')
    console.error(error)
  }
}

const getStatusName = (status) => {
  const statusMap = {
    PENDING: '待支付',
    PAID: '已支付',
    OVERDUE: '已逾期'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colorMap = {
    PENDING: 'orange',
    PAID: 'green',
    OVERDUE: 'red'
  }
  return colorMap[status] || 'blue'
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadInvoices()
  loadAlerts()
})
</script>

<style scoped lang="scss">
.billing-management {
  padding: 24px;
}

.page-header {
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

.invoice-detail {
  padding: 16px 0;
}
</style>

