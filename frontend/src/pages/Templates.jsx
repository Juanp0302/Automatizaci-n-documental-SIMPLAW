import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { templatesAPI } from '../api/templates'
import { useToast } from '../context/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import './Templates.css'

function Templates() {
    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const toast = useToast()

    // Upload Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [uploadError, setUploadError] = useState(null)
    const [newTemplate, setNewTemplate] = useState({
        title: '',
        description: '',
        file: null
    })

    // Delete Confirm State
    const [deleteTarget, setDeleteTarget] = useState(null)

    // Edit Modal State
    const [editTarget, setEditTarget] = useState(null)
    const [editForm, setEditForm] = useState({ title: '', description: '' })
    const [editLoading, setEditLoading] = useState(false)

    // Batch Generation State
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
    const [batchTarget, setBatchTarget] = useState(null)
    const [batchFile, setBatchFile] = useState(null)
    const [batchLoading, setBatchLoading] = useState(false)
    const [batchResults, setBatchResults] = useState(null)

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            const response = await templatesAPI.getAll()
            setTemplates(response.data || [])
        } catch (err) {
            setError('Error al cargar las plantillas')
            toast.error('Error al cargar las plantillas')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await templatesAPI.delete(deleteTarget.id)
            setTemplates(templates.filter(t => t.id !== deleteTarget.id))
            toast.success('Plantilla eliminada exitosamente')
        } catch (err) {
            console.error(err)
            toast.error('Error al eliminar la plantilla')
        } finally {
            setDeleteTarget(null)
        }
    }

    const handleUseTemplate = (id) => {
        navigate(`/documents/new?templateId=${id}`)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setNewTemplate(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setNewTemplate(prev => ({
                ...prev,
                file: e.target.files[0]
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newTemplate.title || !newTemplate.file) {
            setUploadError('Por favor completa todos los campos')
            return
        }

        setUploadError(null)
        setUploadLoading(true)

        try {
            const formData = new FormData()
            formData.append('title', newTemplate.title)
            formData.append('file', newTemplate.file)
            if (newTemplate.description.trim()) {
                formData.append('description', newTemplate.description.trim())
            }

            await templatesAPI.create(formData)

            // Reset and reload
            setIsModalOpen(false)
            setNewTemplate({ title: '', description: '', file: null })
            toast.success('Plantilla subida exitosamente')
            loadTemplates()
        } catch (err) {
            console.error(err)
            setUploadError('Error al subir la plantilla')
            toast.error('Error al subir la plantilla')
        } finally {
            setUploadLoading(false)
        }
    }

    // Edit handlers
    const openEditModal = (template) => {
        setEditTarget(template)
        setEditForm({
            title: template.title,
            description: template.description || ''
        })
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!editTarget || !editForm.title.trim()) return

        setEditLoading(true)
        try {
            await templatesAPI.update(editTarget.id, {
                title: editForm.title.trim(),
                description: editForm.description.trim() || null
            })
            toast.success('Plantilla actualizada exitosamente')
            setEditTarget(null)
            loadTemplates()
        } catch (err) {
            console.error(err)
            toast.error('Error al actualizar la plantilla')
        } finally {
            setEditLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
                <p>Cargando plantillas...</p>
            </div>
        )
    }

    return (
        <div className="templates-page animate-fade-in">
            <div className="page-header">
                <div className="page-header-content">
                    <h1 className="page-title">Plantillas</h1>
                    <p className="page-description">
                        Plantillas disponibles para generar documentos legales
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsModalOpen(true)}
                >
                    + Nueva Plantilla
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Upload Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content animate-slide-up">
                        <div className="modal-header">
                            <h2 className="modal-title">Subir Nueva Plantilla</h2>
                            <button
                                className="modal-close"
                                onClick={() => setIsModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {uploadError && (
                                <div className="error-message">
                                    {uploadError}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Título</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="form-input"
                                    value={newTemplate.title}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Contrato de Arrendamiento"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descripción <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                                <textarea
                                    name="description"
                                    className="form-input form-textarea"
                                    value={newTemplate.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe brevemente esta plantilla..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Archivo Word (.docx)</label>
                                <div className="file-input-wrapper">
                                    <input
                                        type="file"
                                        accept=".docx"
                                        className="form-input"
                                        onChange={handleFileChange}
                                        required
                                    />
                                    <small className="form-help">Solo archivos .docx</small>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={uploadLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={uploadLoading}
                                >
                                    {uploadLoading ? 'Subiendo...' : 'Subir Plantilla'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editTarget && (
                <div className="modal-overlay">
                    <div className="modal-content animate-slide-up">
                        <div className="modal-header">
                            <h2 className="modal-title">Editar Plantilla</h2>
                            <button
                                className="modal-close"
                                onClick={() => setEditTarget(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">Título</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Título de la plantilla"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descripción <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                                <textarea
                                    className="form-input form-textarea"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe brevemente esta plantilla..."
                                    rows={3}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setEditTarget(null)}
                                    disabled={editLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={editLoading || !editForm.title.trim()}
                                >
                                    {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {templates.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">📋</div>
                    <h3 className="empty-state-title">No hay plantillas</h3>
                    <p className="empty-state-description">
                        Aún no se han agregado plantillas al sistema. Sube una nueva plantilla para comenzar.
                    </p>
                    <button
                        className="btn btn-primary mt-4"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Subir Primera Plantilla
                    </button>
                </div>
            ) : (
                <div className="templates-grid">
                    {templates.map((template) => (
                        <div key={template.id} className="template-card card">
                            <div className="template-icon">📄</div>
                            <div className="template-content">
                                <h3 className="template-title">{template.title}</h3>
                                <p className="template-description">
                                    {template.description || 'Sin descripción'}
                                </p>
                                {template.created_at && (
                                    <span className="template-date">
                                        Creada: {new Date(template.created_at).toLocaleDateString('es-ES')}
                                    </span>
                                )}
                            </div>
                            <div className="template-actions">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleUseTemplate(template.id)}
                                    title="Usar Plantilla"
                                    style={{ marginRight: 'auto' }}
                                >
                                    📄 Usar plantilla
                                </button>
                                <button
                                    className="btn-icon btn-secondary"
                                    onClick={() => {
                                        setBatchTarget(template)
                                        setIsBatchModalOpen(true)
                                    }}
                                    title="Generación Masiva (Lote)"
                                >
                                    📦
                                </button>
                                <button
                                    className="btn-icon btn-secondary"
                                    onClick={() => navigate(`/templates/${template.id}/config`)}
                                    title="Configurar lógica y campos"
                                >
                                    ⚙️
                                </button>
                                <button
                                    className="btn-icon btn-secondary"
                                    onClick={() => openEditModal(template)}
                                    title="Editar Plantilla"
                                >
                                    ✏️
                                </button>
                                <button
                                    className="btn-icon btn-icon-danger"
                                    onClick={() => setDeleteTarget(template)}
                                    title="Eliminar Plantilla"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Batch Generation Modal */}
            {isBatchModalOpen && batchTarget && (
                <div className="modal-overlay">
                    <div className="modal-content animate-slide-up" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Generación Masiva: {batchTarget.title}</h2>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    setIsBatchModalOpen(false)
                                    setBatchFile(null)
                                    setBatchResults(null)
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            {!batchResults ? (
                                <>
                                    <div className="batch-step">
                                        <h4>1. Descargar Plantilla Excel</h4>
                                        <p>Descarga el archivo Excel con las columnas correspondientes a las variables de esta plantilla.</p>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={async () => {
                                                try {
                                                    const response = await templatesAPI.downloadBatchTemplate(batchTarget.id)
                                                    const url = window.URL.createObjectURL(new Blob([response.data]))
                                                    const link = document.createElement('a')
                                                    link.href = url
                                                    link.setAttribute('download', `Plantilla_Lote_${batchTarget.title}.xlsx`)
                                                    document.body.appendChild(link)
                                                    link.click()
                                                    link.remove()
                                                } catch (e) {
                                                    toast.error("Error al descargar la plantilla Excel")
                                                }
                                            }}
                                        >
                                            ⬇️ Descargar Excel
                                        </button>
                                    </div>

                                    <div className="batch-step" style={{ marginTop: '2rem' }}>
                                        <h4>2. Subir Archivo Diligenciado</h4>
                                        <p>Sube el archivo Excel con los datos para generar los documentos.</p>
                                        <input
                                            type="file"
                                            accept=".xlsx"
                                            className="form-input"
                                            onChange={(e) => setBatchFile(e.target.files[0])}
                                        />
                                    </div>

                                    <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            disabled={!batchFile || batchLoading}
                                            onClick={async () => {
                                                if (!batchFile) return
                                                setBatchLoading(true)
                                                try {
                                                    const formData = new FormData()
                                                    formData.append('file', batchFile)
                                                    const response = await templatesAPI.batchGenerate(batchTarget.id, formData)
                                                    setBatchResults(response.data)
                                                    toast.success("Proceso completado")
                                                } catch (e) {
                                                    console.error(e)
                                                    toast.error("Error en la generación masiva")
                                                } finally {
                                                    setBatchLoading(false)
                                                }
                                            }}
                                        >
                                            {batchLoading ? 'Procesando...' : '🚀 Generar Documentos'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="batch-results">
                                    <div className="results-summary">
                                        <div className="result-card success">
                                            <h3>{batchResults.success}</h3>
                                            <span>Exitosos</span>
                                        </div>
                                        <div className="result-card error">
                                            <h3>{batchResults.failed}</h3>
                                            <span>Fallidos</span>
                                        </div>
                                    </div>

                                    {batchResults.errors && batchResults.errors.length > 0 && (
                                        <div className="error-list">
                                            <h4>Errores:</h4>
                                            <ul>
                                                {batchResults.errors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="modal-actions">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                setIsBatchModalOpen(false)
                                                setBatchFile(null)
                                                setBatchResults(null)
                                                navigate('/documents')
                                            }}
                                        >
                                            Ver Documentos
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Eliminar Plantilla"
                message={`¿Estás seguro de que deseas eliminar la plantilla "${deleteTarget?.title}"? Los documentos ya generados no se verán afectados.`}
                confirmText="Eliminar"
                danger={true}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}

export default Templates
