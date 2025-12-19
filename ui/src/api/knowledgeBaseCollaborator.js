import request from '../utils/request';

/**
 * 获取所有知识库协作者列表（不分页）
 */
export const getCollaborators = () => {
    return request.get('/knowledge_base_collaborator');
};

/**
 * 根据ID获取协作者详情
 * @param {number|string} id - 协作者ID
 */
export const getCollaboratorById = (id) => {
    return request.get(`/knowledge_base_collaborator/${id}`);
};

/**
 * 创建协作者
 * @param {Object} data - 协作者对象，包含 knowledgeBaseId, userId, role 等字段
 */
export const createCollaborator = (data) => {
    return request.post('/knowledge_base_collaborator', data);
};

/**
 * 更新协作者
 * @param {Object} data - 协作者对象（必须包含 id）
 */
export const updateCollaborator = (data) => {
    return request.put('/knowledge_base_collaborator', data);
};

/**
 * 删除协作者
 * @param {number|string} id - 协作者ID
 */
export const deleteCollaborator = (id) => {
    return request.delete(`/knowledge_base_collaborator/${id}`);
};

/**
 * 分页查询协作者列表
 * @param {Object} params - 分页参数，包含 page, size, keyword, sortBy, sortOrder
 */
export const getCollaboratorPage = (params) => {
    return request.post('/knowledge_base_collaborator/page', params);
};

/**
 * 根据知识库ID获取所有协作者
 * @param {number|string} knowledgeBaseId - 知识库ID
 */
export const getCollaboratorsByKnowledgeBaseId = (knowledgeBaseId) => {
    return request.get('/knowledge_base_collaborator', {
        params: { knowledgeBaseId }
    });
};

