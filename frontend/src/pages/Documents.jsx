import { useState, useEffect } from 'react'
import { documentsAPI } from '../api/documents'
import { useToast } from '../context/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import './Documents.css'

function Documents() {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFilter, setDateFilter] = useState('all')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const toast = useToast()

    useEffect(() => {
        const timer = setTimeout(() => {
            loadDocuments()
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery, dateFilter])

    const loadDocuments = async () => {
        setLoading(true)
        try {
            const params = {}
            if (searchQuery) {
                params.search = searchQuery
            }

            const now = new Date()
            let startDate = null

            switch (dateFilter) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    break
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    break
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                    break
                default:
                    startDate = null
            }

            if (startDate) {
                params.start_date = startDate.toISOString()
            }

            const response = await documentsAPI.getAll(params)
            setDocuments(response.data || [])
            setSelectedIds([]) // Clear selection when data reloads
        } catch (err) {
            setError('Error al cargar los documentos')
            toast.error('Error al cargar los documentos')
            console.error(err)
            setDocuments([])
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (id, title, format = 'docx') => {
        try {
            const response = await documentsAPI.download(id, format)
            const extension = format === 'pdf' ? 'pdf' : 'docx'
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${title}.${extension}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success(`Documento "${title}" descargado como ${extension.toUpperCase()}`)
        } catch (err) {
            console.error('Error downloading document:', err)
            toast.error('Error al descargar el documento')
        }
    }

    const handleBulkDownload = async (format = 'word') => {
        if (selectedIds.length === 0) return
        try {
            const isPdf = format === 'pdf'
            if (isPdf) {
                toast.info(`Iniciando conversión a PDF de ${selectedIds.length} documentos. Esto puede tardar unos segundos...`)
            } else {
                toast.info(`Generando ZIP con ${selectedIds.length} documentos...`)
            }
            
            const response = await documentsAPI.bulkDownload(selectedIds, format)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
            const extension = 'zip'
            const baseName = isPdf ? 'documentos_pdf' : 'documentos'
            link.setAttribute('download', `${baseName}_${timestamp}.${extension}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success(isPdf ? "PDFs generados y descargados" : "Descarga masiva iniciada")
        } catch (err) {
            console.error('Error in bulk download:', err)
            let errorMsg = 'Error en la descarga masiva'
            
            // If response is a Blob (common when responseType: 'blob' is used), parse it
            if (err.response?.data instanceof Blob && err.response.data.type === 'application/json') {
                const reader = new FileReader()
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result)
                        toast.error(errorData.detail || errorMsg)
                    } catch (e) {
                        toast.error(errorMsg)
                    }
                }
                reader.readAsText(err.response.data)
                return // Toast is handled in onload
            } else {
                errorMsg = err.response?.data?.detail || errorMsg
                toast.error(errorMsg)
            }
        }
    }

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id) 
                : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === documents.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(documents.map(d => d.id))
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await documentsAPI.delete(deleteTarget.id)
            setDocuments(documents.filter(d => d.id !== deleteTarget.id))
            toast.success(`Documento "${deleteTarget.title}" eliminado`)
        } catch (err) {
            console.error('Error deleting document:', err)
            const errorMsg = err.response?.data?.detail || 'Error al eliminar el documento'
            toast.error(errorMsg)
        } finally {
            setDeleteTarget(null)
        }
    }

    // --- Filtering logic removed (now server-side) ---

    if (loading && documents.length === 0) { // Only show full page loader on initial load
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
                <p>Cargando documentos...</p>
            </div>
        )
    }

    return (
        <div className="documents-page animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Documentos</h1>
                <p className="page-description">
                    Historial de documentos generados
                </p>
            </div>

            {selectedIds.length > 0 && (
                <div className="bulk-actions-bar animate-slide-down">
                    <div className="selection-info">
                        <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'documento seleccionado' : 'documentos seleccionados'}
                    </div>
                    <div className="bulk-buttons">
                        <button 
                            className="btn btn-primary"
                            onClick={() => handleBulkDownload('word')}
                        >
                            📦 Word (ZIP)
                        </button>
                        <button 
                            className="btn btn-success"
                            style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
                            onClick={() => handleBulkDownload('pdf')}
                        >
                            📋 PDF (ZIP)
                        </button>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setSelectedIds([])}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="error-banner">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Search & Filters */}
            {(documents.length > 0 || searchQuery || dateFilter !== 'all') && (
                <div className="filters-row">
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar por título..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="search-clear"
                                onClick={() => setSearchQuery('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <select
                        className="filter-select"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="all">Todas las fechas</option>
                        <option value="today">Hoy</option>
                        <option value="week">Última semana</option>
                        <option value="month">Último mes</option>
                    </select>
                </div>
            )}

            {documents.length === 0 && !loading ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">
                        {searchQuery || dateFilter !== 'all' ? '🔍' : '📁'}
                    </div>
                    <h3 className="empty-state-title">
                        {searchQuery || dateFilter !== 'all' ? 'Sin resultados' : 'No hay documentos'}
                    </h3>
                    <p className="empty-state-description">
                        {searchQuery || dateFilter !== 'all'
                            ? 'No se encontraron documentos con los filtros aplicados.'
                            : 'Aún no has generado ningún documento. Crea uno nuevo seleccionando una plantilla.'}
                    </p>
                    {searchQuery || dateFilter !== 'all' ? (
                        <button
                            className="btn btn-secondary"
                            onClick={() => { setSearchQuery(''); setDateFilter('all') }}
                        >
                            Limpiar Filtros
                        </button>
                    ) : (
                        <a href="/documents/new" className="btn btn-primary">
                            Crear Documento
                        </a>
                    )}
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={documents.length > 0 && selectedIds.length === documents.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>Título</th>
                                <th>Fecha de Creación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc.id} className={selectedIds.includes(doc.id) ? 'row-selected' : ''}>
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(doc.id)}
                                            onChange={() => toggleSelect(doc.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="doc-title-cell">
                                            <span className="doc-icon">📄</span>
                                            {doc.title}
                                            {doc.version > 1 && (
                                                <span className="version-badge" style={{
                                                    marginLeft: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    backgroundColor: '#e0f2fe',
                                                    color: '#0369a1',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: '9999px',
                                                    fontWeight: '600'
                                                }}>
                                                    v{doc.version}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {new Date(doc.created_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <div className="btn-group">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleDownload(doc.id, doc.title, 'docx')}
                                                    title="Descargar Word"
                                                >
                                                    📄 Word
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleDownload(doc.id, doc.title, 'pdf')}
                                                    title="Descargar PDF"
                                                >
                                                    📑 PDF
                                                </button>
                                                <a
                                                    href={`/documents/new?parentId=${doc.id}`}
                                                    className="btn btn-secondary btn-sm"
                                                    title="Crear Nueva Versión"
                                                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                                >
                                                    🔄
                                                </a>
                                            </div>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => setDeleteTarget(doc)}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Eliminar Documento"
                message={`¿Estás seguro de que deseas eliminar "${deleteTarget?.title}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                danger={true}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}

export default Documents
