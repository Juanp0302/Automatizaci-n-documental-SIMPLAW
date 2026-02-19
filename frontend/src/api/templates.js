import api from './client'

export const templatesAPI = {
    getAll: () => api.get('/templates'),
    getById: (id) => api.get(`/templates/${id}`),
    create: (data) => api.post('/templates/', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    update: (id, data) => api.put(`/templates/${id}`, data),
    delete: (id) => api.delete(`/templates/${id}`),
    getVariables: (id) => api.get(`/templates/${id}/variables`),
    downloadBatchTemplate: (id) => api.get(`/templates/${id}/batch-template`, { responseType: 'blob' }),
    batchGenerate: (id, formData) => api.post(`/templates/${id}/batch-generate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}
