import request from '../utils/request';

/**
 * 根据文档ID获取评论列表
 * @param {number|string} documentId - 文档ID
 */
export const getCommentsByDocumentId = (documentId) => {
    return request.get(`/document-comment/document/${documentId}`);
};

/**
 * 创建评论
 * @param {Object} data - 评论对象，包含 documentId, content, anchor 等字段
 */
export const createComment = (data) => {
    return request.post('/document-comment', data);
};

/**
 * 更新评论
 * @param {number|string} id - 评论ID
 * @param {Object} data - 要更新的评论对象
 */
export const updateComment = (id, data) => {
    return request.put(`/document-comment/${id}`, data);
};

/**
 * 更新评论状态（解决/激活）
 * @param {number|string} id - 评论ID
 * @param {string} status - 状态值 ('ACTIVE' | 'RESOLVED')
 */
export const updateCommentStatus = (id, status) => {
    return request.put(`/document-comment/${id}/status`, null, {
        params: { status }
    });
};

/**
 * 删除评论（逻辑删除）
 * @param {number|string} id - 评论ID
 */
export const deleteComment = (id) => {
    return request.delete(`/document-comment/${id}`);
};

/**
 * 根据ID获取评论详情
 * @param {number|string} id - 评论ID
 */
export const getCommentById = (id) => {
    return request.get(`/document-comment/${id}`);
};

/**
 * 分页查询评论列表
 * @param {Object} params - 分页参数，包含 page, size, keyword, sortBy, sortOrder
 */
export const getCommentPage = (params) => {
    return request.post('/document-comment/page', params);
};

