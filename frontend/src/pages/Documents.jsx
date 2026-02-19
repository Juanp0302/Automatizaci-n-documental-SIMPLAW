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

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await documentsAPI.delete(deleteTarget.id)
            setDocuments(documents.filter(d => d.id !== deleteTarget.id))
            toast.success(`Documento "${deleteTarget.title}" eliminado`)
        } catch (err) {
            console.error('Error deleting document:', err)
            toast.error('Error al eliminar el documento')
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
                                <th>Título</th>
                                <th>Fecha de Creación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc.id}>
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
