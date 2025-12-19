import request from '../utils/request';

/**
 * 分页查询文档模板列表
 * @param {Object} params - 查询参数，包含 page, size, scope, title
 */
export const getTemplateList = (params = {}) => {
    return request.get('/document_template/list', { params });
};

/**
 * 根据ID获取模板详情
 * @param {number|string} id - 模板ID
 */
export const getTemplateById = (id) => {
    return request.get(`/document_template/${id}`);
};

/**
 * 创建模板
 * @param {Object} data - 模板对象，包含 title, description, content, scope 等字段
 */
export const createTemplate = (data) => {
    return request.post('/document_template/create', data);
};

/**
 * 更新模板
 * @param {Object} data - 模板对象（必须包含 id）
 */
export const updateTemplate = (data) => {
    return request.post('/document_template/update', data);
};

/**
 * 删除模板（逻辑删除）
 * @param {number|string} id - 模板ID
 */
export const deleteTemplate = (id) => {
    return request.delete(`/document_template/delete/${id}`);
};

/**
 * 下载模板（Markdown格式）
 * @param {number|string} id - 模板ID
 */
export const downloadTemplate = (id) => {
    return request.get(`/document_template/download/${id}`, {
        responseType: 'blob'
    });
};

/**
 * 应用模板：获取模板内容
 * @param {number|string} id - 模板ID
 */
export const applyTemplate = (id) => {
    return request.get(`/document_template/apply/${id}`, {
        responseType: 'text'
    });
};

