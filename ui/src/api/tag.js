import request from '../utils/request';

/**
 * 获取所有标签列表（不分页）
 */
export const getTags = () => {
    return request.get('/tag');
};

/**
 * 根据ID获取标签详情
 * @param {number|string} id - 标签ID
 */
export const getTagById = (id) => {
    return request.get(`/tag/${id}`);
};

/**
 * 创建标签
 * @param {Object} data - 标签对象，包含 name, color, description 等字段
 */
export const createTag = (data) => {
    return request.post('/tag', data);
};

/**
 * 更新标签
 * @param {Object} data - 标签对象（必须包含 id）
 */
export const updateTag = (data) => {
    return request.put('/tag', data);
};

/**
 * 删除标签
 * @param {number|string} id - 标签ID
 */
export const deleteTag = (id) => {
    return request.delete(`/tag/${id}`);
};

/**
 * 批量删除标签
 * @param {Array<number|string>} ids - 标签ID数组
 */
export const batchDeleteTags = (ids) => {
    return request.delete('/tag/batch', { data: ids });
};

/**
 * 分页查询标签列表
 * @param {Object} params - 分页参数，包含 page, size, keyword, sortBy, sortOrder
 */
export const getTagPage = (params) => {
    return request.post('/tag/page', params);
};

