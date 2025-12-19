import request from '../utils/request';

/**
 * 生成月度账单
 * @param {number|string} userId - 用户ID
 * @param {number} year - 年份
 * @param {number} month - 月份
 */
export const generateMonthlyInvoice = (userId, year, month) => {
    return request.post('/billing/invoice/monthly', null, {
        params: { userId, year, month }
    });
};

/**
 * 生成年度账单
 * @param {number|string} userId - 用户ID
 * @param {number} year - 年份
 */
export const generateYearlyInvoice = (userId, year) => {
    return request.post('/billing/invoice/yearly', null, {
        params: { userId, year }
    });
};

/**
 * 获取用户账单列表
 * @param {number|string} userId - 用户ID
 * @param {string} status - 账单状态（可选）
 */
export const getUserInvoices = (userId, status = null) => {
    const params = { userId };
    if (status) {
        params.status = status;
    }
    return request.get(`/billing/invoice/user/${userId}`, { params });
};

/**
 * 获取账单详情
 * @param {number|string} invoiceId - 账单ID
 */
export const getInvoiceDetail = (invoiceId) => {
    return request.get(`/billing/invoice/${invoiceId}`);
};

/**
 * 支付账单
 * @param {number|string} invoiceId - 账单ID
 * @param {number} amount - 支付金额
 */
export const payInvoice = (invoiceId, amount) => {
    return request.post(`/billing/invoice/${invoiceId}/pay`, null, {
        params: { amount }
    });
};

/**
 * 创建Webhook配置
 * @param {Object} data - Webhook配置对象
 */
export const createBillingWebhook = (data) => {
    return request.post('/billing/webhook', data);
};

/**
 * 更新Webhook配置
 * @param {number|string} webhookId - Webhook ID
 * @param {Object} data - Webhook配置对象
 */
export const updateBillingWebhook = (webhookId, data) => {
    return request.put(`/billing/webhook/${webhookId}`, data);
};

/**
 * 删除Webhook配置
 * @param {number|string} webhookId - Webhook ID
 */
export const deleteBillingWebhook = (webhookId) => {
    return request.delete(`/billing/webhook/${webhookId}`);
};

/**
 * 获取Webhook配置列表
 * @param {number|string} organizationId - 组织ID（可选）
 */
export const getBillingWebhooks = (organizationId = null) => {
    const params = {};
    if (organizationId) {
        params.organizationId = organizationId;
    }
    return request.get('/billing/webhook', { params });
};

/**
 * 创建预警配置
 * @param {Object} data - 预警配置对象
 */
export const createAlert = (data) => {
    return request.post('/billing/alert', data);
};

/**
 * 更新预警配置
 * @param {number|string} alertId - 预警ID
 * @param {Object} data - 预警配置对象
 */
export const updateAlert = (alertId, data) => {
    return request.put(`/billing/alert/${alertId}`, data);
};

/**
 * 删除预警配置
 * @param {number|string} alertId - 预警ID
 */
export const deleteAlert = (alertId) => {
    return request.delete(`/billing/alert/${alertId}`);
};

/**
 * 获取用户预警配置
 * @param {number|string} userId - 用户ID
 */
export const getUserAlerts = (userId) => {
    return request.get(`/billing/alert/user/${userId}`);
};

