import request from '../utils/request';

/**
 * 获取所有Webhook列表（不分页）
 */
export const getWebhooks = () => {
    return request.get('/webhook');
};

/**
 * 根据ID获取Webhook详情
 * @param {number|string} id - Webhook ID
 */
export const getWebhookById = (id) => {
    return request.get(`/webhook/${id}`);
};

/**
 * 创建Webhook
 * @param {Object} data - Webhook对象，包含 name, url, events, enabled 等字段
 */
export const createWebhook = (data) => {
    return request.post('/webhook', data);
};

/**
 * 更新Webhook
 * @param {Object} data - Webhook对象（必须包含 id）
 */
export const updateWebhook = (data) => {
    return request.put('/webhook', data);
};

/**
 * 删除Webhook
 * @param {number|string} id - Webhook ID
 */
export const deleteWebhook = (id) => {
    return request.delete(`/webhook/${id}`);
};

/**
 * 分页查询Webhook列表
 * @param {Object} params - 分页参数，包含 page, size, keyword, sortBy, sortOrder
 */
export const getWebhookPage = (params) => {
    return request.post('/webhook/page', params);
};

