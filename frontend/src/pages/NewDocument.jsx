import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { templatesAPI } from '../api/templates'
import { documentsAPI } from '../api/documents'
import { useToast } from '../context/ToastContext'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import DynamicForm from '../components/DynamicForm'
import './NewDocument.css'

function NewDocument() {
    const [templates, setTemplates] = useState([])
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [templateVariables, setTemplateVariables] = useState([])
    const [formData, setFormData] = useState({})
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const toast = useToast()

    // State for pre-filling data from parent document
    const [prefillData, setPrefillData] = useState(null)

    useEffect(() => {
        loadTemplates()
    }, [])

    useEffect(() => {
        const init = async () => {
            if (templates.length > 0) {
                const parentId = searchParams.get('parentId')
                const templateId = searchParams.get('templateId')

                if (parentId) {
                    try {
                        setLoading(true) // Show loading while fetching parent
                        const response = await documentsAPI.getById(parentId)
                        const parentDoc = response.data

                        // Set basic info
                        setTitle(parentDoc.title)

                        // Store variables to pre-fill once template is set
                        // We also need to set the template
                        const template = templates.find(t => t.id === parentDoc.template_id)
                        if (template) {
                            // We set prefill data FIRST so the next effect sees it
                            setPrefillData(parentDoc.variables)
                            setSelectedTemplate(template)
                        } else {
                            toast.error("La plantilla de este documento ya no existe")
                        }
                    } catch (err) {
                        console.error("Error fetching parent doc:", err)
                        toast.error("Error al cargar la versión anterior")
                    } finally {
                        setLoading(false)
                    }
                } else if (templateId) {
                    const template = templates.find(t => t.id === parseInt(templateId))
                    if (template) {
                        setSelectedTemplate(template)
                    }
                }
            }
        }
        init()
    }, [templates, searchParams])

    useEffect(() => {
        if (selectedTemplate) {
            if (selectedTemplate.variables_schema) {
                // Use schema for variables
                let schema = selectedTemplate.variables_schema
                if (typeof schema === 'string') {
                    try {
                        schema = JSON.parse(schema)
                    } catch (e) {
                        console.error("Error parsing schema:", e)
                        schema = []
                    }
                }

                // Initialize form data based on schema
                const initialData = {}
                schema.forEach(field => {
                    // Use prefill data if available, matches field name
                    if (prefillData && prefillData[field.name]) {
                        initialData[field.name] = prefillData[field.name]
                    } else {
                        initialData[field.name] = ''
                    }
                })
                setFormData(initialData)
                setTemplateVariables(schema)
            } else {
                loadTemplateVariables(selectedTemplate.id)
            }
        } else {
            setTemplateVariables([])
            setFormData({})
        }
    }, [selectedTemplate, prefillData]) // Added prefillData dependency


    const loadTemplates = async () => {
        try {
            const response = await templatesAPI.getAll()
            setTemplates(response.data || [])
        } catch (err) {
            setError('Error al cargar las plantillas')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const loadTemplateVariables = async (templateId) => {
        try {
            const response = await templatesAPI.getVariables(templateId)
            setTemplateVariables(response.data || [])
            // Initialize form data
            const initialData = {}
            response.data.forEach(v => {
                if (prefillData && prefillData[v]) {
                    initialData[v] = prefillData[v]
                } else {
                    initialData[v] = ''
                }
            })
            setFormData(initialData)
        } catch (err) {
            console.error("Error loading variables:", err)
            // Don't block UI, just no variables
        }
    }

    const handleInputChange = (variable, value) => {
        setFormData(prev => ({
            ...prev,
            [variable]: value
        }))
    }

    const handlePreview = async () => {
        if (!selectedTemplate || !title.trim()) return

        setPreviewLoading(true)
        setShowPreview(true) // Open modal immediately to show loading state
        setPreviewUrl(null)
        setError(null)

        try {
            const response = await documentsAPI.preview({
                title: title.trim(),
                template_id: selectedTemplate.id,
                variables: formData
            })

            // Create Blob URL from response
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(pdfBlob)
            setPreviewUrl(url)
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Error al generar la vista previa'
            toast.error(errorMsg)
            setShowPreview(false) // Close modal on error
            console.error(err)
        } finally {
            setPreviewLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedTemplate || !title.trim()) return

        setSubmitting(true)
        setError(null)

        try {
            const parentId = searchParams.get('parentId')
            await documentsAPI.create({
                title: title.trim(),
                template_id: selectedTemplate.id,
                variables: formData,
                parent_id: parentId ? parseInt(parentId) : null
            })
            setSuccess(true)
            toast.success('¡Documento generado exitosamente!')
            setTimeout(() => navigate('/documents'), 1500)
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Error al crear el documento'
            setError(errorMsg)
            toast.error(errorMsg)
            console.error(err)
        } finally {
            setSubmitting(false)
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
        <div className="new-document-page animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Nuevo Documento</h1>
                <p className="page-description">
                    Selecciona una plantilla y genera un nuevo documento
                </p>
            </div>

            {success ? (
                <div className="success-message card animate-slide-up">
                    <div className="success-icon">✅</div>
                    <h3>¡Documento creado exitosamente!</h3>
                    <p>Redirigiendo a la lista de documentos...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="new-document-form">
                    {error && (
                        <div className="error-banner">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Document Title */}
                    <div className="form-section card">
                        <h2 className="form-section-title">1. Nombre del Documento</h2>
                        <div className="form-group">
                            <label className="form-label" htmlFor="title">
                                Título del documento
                            </label>
                            <input
                                id="title"
                                type="text"
                                className="form-input"
                                placeholder="Ej: Contrato de Arrendamiento - Juan Pérez"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div className="form-section card">
                        <h2 className="form-section-title">2. Seleccionar Plantilla</h2>

                        {templates.length === 0 ? (
                            <p className="no-templates">No hay plantillas disponibles</p>
                        ) : (
                            <div className="template-select-grid">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`template-option ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedTemplate(template)}
                                    >
                                        <div className="template-option-icon">📋</div>
                                        <div className="template-option-content">
                                            <h4>{template.title}</h4>
                                            <p>{template.description || 'Sin descripción'}</p>
                                        </div>
                                        <div className="template-option-check">
                                            {selectedTemplate?.id === template.id && '✓'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Variables Form */}
                    {selectedTemplate && templateVariables.length > 0 && (
                        <div className="form-section card animate-slide-up">
                            <h2 className="form-section-title">3. Completar Datos</h2>
                            <p className="section-description">
                                Completa la información solicitada por la plantilla
                            </p>

                            <div className="variables-grid">
                                {selectedTemplate.variables_schema ? (
                                    <DynamicForm
                                        schema={typeof selectedTemplate.variables_schema === 'string' ? JSON.parse(selectedTemplate.variables_schema) : selectedTemplate.variables_schema}
                                        value={formData}
                                        onChange={setFormData}
                                    />
                                ) : (
                                    templateVariables.map((variable) => (
                                        <div key={variable} className="form-group">
                                            <label className="form-label">
                                                {(variable.includes('::') ? variable.split('::')[0] : variable).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </label>
                                            <textarea
                                                className="form-input form-textarea"
                                                value={formData[variable] || ''}
                                                onChange={(e) => handleInputChange(variable, e.target.value)}
                                                placeholder={`Ingresa ${variable}...`}
                                                required
                                                rows={4}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/documents')}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn-info"
                            style={{ marginRight: 'auto', marginLeft: '1rem' }}
                            onClick={handlePreview}
                            disabled={!selectedTemplate || !title.trim() || submitting || previewLoading}
                        >
                            👁️ Vista Previa
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={!selectedTemplate || !title.trim() || submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner"></span>
                                    Generando...
                                </>
                            ) : (
                                '✨ Generar Documento'
                            )}
                        </button>
                    </div>
                </form>
            )}
            {/* Preview Modal */}
            <DocumentPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                pdfUrl={previewUrl}
                title={title}
            />
        </div>
    )
}

export default NewDocument
