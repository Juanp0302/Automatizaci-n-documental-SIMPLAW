import api from './client'

export const documentsAPI = {
    getAll: (params) => api.get('/documents', { params }),
    getById: (id) => api.get(`/documents/${id}`),
    create: (data) => api.post('/documents', data),
    download: (id, format = 'docx') => api.get(`/documents/${id}/download`, {
        params: { format },
        responseType: 'blob'
    }),
    delete: (id) => api.delete(`/documents/${id}`),
    preview: (data) => api.post('/documents/preview', data, { responseType: 'blob' })
}
