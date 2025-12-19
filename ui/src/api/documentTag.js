import request from '../utils/request';

/**
 * 获取所有文档标签关联列表（不分页）
 */
export const getDocumentTags = () => {
    return request.get('/document_tag');
};

/**
 * 根据ID获取文档标签关联详情
 * @param {number|string} id - 关联ID
 */
export const getDocumentTagById = (id) => {
    return request.get(`/document_tag/${id}`);
};

/**
 * 创建文档标签关联
 * @param {Object} data - 关联对象，包含 entityId, tagId, entityType 等字段
 */
export const createDocumentTag = (data) => {
    return request.post('/document_tag', data);
};

/**
 * 更新文档标签关联
 * @param {Object} data - 关联对象（必须包含 id）
 */
export const updateDocumentTag = (data) => {
    return request.put('/document_tag', data);
};

/**
 * 删除文档标签关联
 * @param {number|string} id - 关联ID
 */
export const deleteDocumentTag = (id) => {
    return request.delete(`/document_tag/${id}`);
};

/**
 * 分页查询文档标签关联列表
 * @param {Object} params - 分页参数，包含 page, size, keyword, sortBy, sortOrder
 */
export const getDocumentTagPage = (params) => {
    return request.post('/document_tag/page', params);
};

/**
 * 根据文档ID获取所有关联的标签
 * @param {number|string} documentId - 文档ID
 */
export const getTagsByDocumentId = (documentId) => {
    return request.get('/document_tag', {
        params: { entityId: documentId, entityType: 'document' }
    });
};

