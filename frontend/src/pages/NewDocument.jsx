import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { templatesAPI } from '../api/templates'
import { documentsAPI } from '../api/documents'
import { useToast } from '../context/ToastContext'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import DynamicForm from '../components/DynamicForm'
import './NewDocument.css'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convierte nombre de variable a etiqueta legible */
function varLabel(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/** Detecta grupos numerados de una lista de variables planas (sin schema) */
function detectGroups(variables) {
    const patternFull = /^(.+?)_(\d+)_([a-z][a-z0-9_]*)$/
    const patternSimple = /^(.+?)_(\d+)$/
    const groupsMap = {}
    const groupOrder = []
    const simple = []

    for (const v of variables) {
        let m = v.match(patternFull)
        if (m) {
            const [, g, , f] = m
            if (!groupsMap[g]) { groupsMap[g] = []; groupOrder.push(g) }
            if (!groupsMap[g].find(x => x.name === f)) groupsMap[g].push({ name: f, label: varLabel(f) })
            continue
        }
        m = v.match(patternSimple)
        if (m) {
            const [, g] = m
            if (!groupsMap[g]) { groupsMap[g] = []; groupOrder.push(g) }
            continue
        }
        simple.push(v)
    }

    const toLabel = n => {
        const w = n.replace(/_/g, ' ').trim()
        const cap = w.charAt(0).toUpperCase() + w.slice(1)
        if (cap.endsWith('o') || cap.endsWith('a') || cap.endsWith('e')) return cap + 's'
        return cap + 'es'
    }

    return {
        simple,
        groups: groupOrder.map(g => ({ name: g, label: toLabel(g), fields: groupsMap[g] }))
    }
}

/** Convierte schema (variables_schema) a {simple, groups} */
function schemaToGroups(schema) {
    const groups = schema.filter(f => f.type === 'numbered_elements').map(f => ({
        name: f.name,
        label: f.label || varLabel(f.name),
        fields: (f.fields || []).map(sf => ({ 
            name: sf.name, 
            label: sf.label || varLabel(sf.name),
            type: sf.type || 'text',
            options: sf.options || []
        }))
    }))
    const simple = schema.filter(f => f.type !== 'numbered_elements')
    return { simple, groups }
}

// ─── DynamicGroupTable ────────────────────────────────────────────────────────
/**
 * Tabla dinámica para grupos numerados (pagos, servicios, etc.)
 * UI: cabecera + filas editables + botón "Agregar"
 */
function DynamicGroupTable({ group, items, onChange }) {
    const addItem = () => {
        const empty = {}
        group.fields.forEach(f => { empty[f.name] = '' })
        onChange([...items, empty])
    }
    const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx))
    const updateItem = (idx, field, value) => {
        const updated = items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
        onChange(updated)
    }

    return (
        <div className="dyn-group">
            <div className="dyn-group-header">
                <span className="dyn-group-icon">📋</span>
                <h3 className="dyn-group-title">{group.label}</h3>
                <span className="dyn-group-hint">
                    {items.length === 0 ? 'Sin elementos — agrega el primero abajo' : `${items.length} elemento${items.length > 1 ? 's' : ''}`}
                </span>
            </div>

            {items.length > 0 && (
                <div className="dyn-group-cards">
                    {items.map((item, idx) => (
                        <div key={idx} className="dyn-item-card animate-slide-up">
                            <div className="dyn-item-card-header">
                                <h4>{group.label.replace(/s$/, '').replace(/es$/, '')} #{idx + 1}</h4>
                                <button
                                    type="button"
                                    className="btn-icon"
                                    onClick={() => removeItem(idx)}
                                    title="Quitar este elemento"
                                >
                                    🗑️
                                </button>
                            </div>
                            <div className="dyn-item-card-body">
                                {group.fields.map(f => (
                                    <div key={f.name} className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label className="form-label">{f.label}</label>
                                        
                                        {f.type === 'textarea' ? (
                                            <textarea
                                                className="form-input"
                                                value={item[f.name] || ''}
                                                onChange={e => updateItem(idx, f.name, e.target.value)}
                                                placeholder={f.label}
                                                rows={3}
                                                style={{ resize: 'vertical' }}
                                            />
                                        ) : f.type === 'select' ? (
                                            <select
                                                className="form-select"
                                                value={item[f.name] || ''}
                                                onChange={e => updateItem(idx, f.name, e.target.value)}
                                            >
                                                <option value="" disabled>Seleccione una opción...</option>
                                                {(f.options || []).map((opt, i) => {
                                                    const optLabel = typeof opt === 'object' ? opt.label : (typeof opt === 'string' && opt.includes('::') ? opt.split('::')[0] : opt);
                                                    const optVal = typeof opt === 'object' ? opt.value : (typeof opt === 'string' && opt.includes('::') ? opt.split('::')[1] : opt);
                                                    return <option key={i} value={optVal}>{optLabel}</option>
                                                })}
                                            </select>
                                        ) : (
                                            <input
                                                className="form-input"
                                                type={f.type === 'date' ? 'date' : 'text'}
                                                value={item[f.name] || ''}
                                                onChange={e => updateItem(idx, f.name, e.target.value)}
                                                placeholder={f.label}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button type="button" className="dyn-btn-add" onClick={addItem} style={{ marginTop: '1rem' }}>
                + Agregar {group.label.replace(/s$/, '').replace(/es$/, '')}
            </button>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function NewDocument() {
    const [templates, setTemplates] = useState([])
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [simpleFields, setSimpleFields] = useState([])       // variables planas/schema
    const [dynamicGroups, setDynamicGroups] = useState([])     // grupos numerados
    const [formData, setFormData] = useState({})               // valores campos simples
    const [groupItems, setGroupItems] = useState({})           // { pagoItems: [{monto,concepto},...] }
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(true)
    const [loadingVars, setLoadingVars] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [aiReviewSummary, setAiReviewSummary] = useState(null)
    const [showPreview, setShowPreview] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [hasSchema, setHasSchema] = useState(false)

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const toast = useToast()
    const [prefillData, setPrefillData] = useState(null)

    useEffect(() => { loadTemplates() }, [])

    useEffect(() => {
        const init = async () => {
            if (templates.length > 0) {
                const parentId = searchParams.get('parentId')
                const templateId = searchParams.get('templateId')
                if (parentId) {
                    try {
                        setLoading(true)
                        const response = await documentsAPI.getById(parentId)
                        const parentDoc = response.data
                        setTitle(parentDoc.title)
                        const template = templates.find(t => t.id === parentDoc.template_id)
                        if (template) {
                            setPrefillData(parentDoc.variables)
                            setSelectedTemplate(template)
                        } else {
                            toast.error("La plantilla de este documento ya no existe")
                        }
                    } catch (err) {
                        console.error(err)
                        toast.error("Error al cargar la versión anterior")
                    } finally {
                        setLoading(false)
                    }
                } else if (templateId) {
                    const template = templates.find(t => t.id === parseInt(templateId))
                    if (template) setSelectedTemplate(template)
                }
            }
        }
        init()
    }, [templates, searchParams])

    // When template changes → load variables & detect groups
    useEffect(() => {
        if (!selectedTemplate) {
            setSimpleFields([])
            setDynamicGroups([])
            setFormData({})
            setGroupItems({})
            setHasSchema(false)
            return
        }
        loadVariables(selectedTemplate)
    }, [selectedTemplate, prefillData])

    const loadTemplates = async () => {
        try {
            const response = await templatesAPI.getAll()
            setTemplates(response.data || [])
        } catch (err) {
            setError('Error al cargar las plantillas')
        } finally {
            setLoading(false)
        }
    }

    const loadVariables = async (template) => {
        setLoadingVars(true)
        try {
            let simple = []
            let groups = []
            let usingSchema = false

            if (template.variables_schema) {
                // Template has configured schema
                let schema = template.variables_schema
                if (typeof schema === 'string') { try { schema = JSON.parse(schema) } catch (e) { schema = [] } }
                const parsed = schemaToGroups(Array.isArray(schema) ? schema : [])
                simple = parsed.simple
                groups = parsed.groups
                usingSchema = true
            } else {
                // No schema → auto-detect from Word file
                const response = await templatesAPI.getVariableGroups(template.id)
                const detected = response.data
                // simple variables come back as strings
                simple = (detected.simple || []).map(name => ({ name, label: varLabel(name), type: 'text' }))
                groups = detected.groups || []
            }

            setHasSchema(usingSchema)
            setSimpleFields(simple)
            setDynamicGroups(groups)

            // Initialize form data for simple fields
            const initialData = {}
            simple.forEach(f => {
                const fieldName = typeof f === 'string' ? f : f.name
                initialData[fieldName] = (prefillData && prefillData[fieldName]) ? prefillData[fieldName] : ''
            })
            setFormData(initialData)

            // Initialize group items
            const initialGroups = {}
            groups.forEach(g => {
                const key = g.name
                initialGroups[key] = (prefillData && prefillData[`${key}_items`]) ? prefillData[`${key}_items`] : []
            })
            setGroupItems(initialGroups)

        } catch (err) {
            console.error("Error loading variables:", err)
            toast.error("Error al cargar las variables de la plantilla")
        } finally {
            setLoadingVars(false)
        }
    }

    /** Construye el objeto `variables` para enviar al backend */
    const buildVariables = () => {
        const vars = { ...formData }
        // Serialize group items as {group}_items array (backend expand_numbered_elements uses this)
        Object.entries(groupItems).forEach(([groupName, items]) => {
            vars[`${groupName}_items`] = items
        })
        return vars
    }

    const handlePreview = async () => {
        if (!selectedTemplate || !title.trim()) return
        setPreviewLoading(true)
        setShowPreview(true)
        setPreviewUrl(null)
        setError(null)
        try {
            const response = await documentsAPI.preview({
                title: title.trim(),
                template_id: selectedTemplate.id,
                variables: buildVariables()
            })
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
            setPreviewUrl(window.URL.createObjectURL(pdfBlob))
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error al generar la vista previa')
            setShowPreview(false)
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
            const response = await documentsAPI.create({
                title: title.trim(),
                template_id: selectedTemplate.id,
                variables: buildVariables(),
                parent_id: parentId ? parseInt(parentId) : null
            })
            const reviewSummary = response.data?.ai_review_summary || null
            setAiReviewSummary(reviewSummary)
            setSuccess(true)
            toast.success('¡Documento generado exitosamente!')
            setTimeout(() => navigate('/documents'), 4000)
        } catch (err) {
            const msg = err.response?.data?.detail || 'Error al crear el documento'
            setError(msg)
            toast.error(msg)
        } finally {
            setSubmitting(false)
        }
    }

    const hasVariables = simpleFields.length > 0 || dynamicGroups.length > 0

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
                <p className="page-description">Selecciona una plantilla y completa los datos</p>
            </div>

            {success ? (
                <div className="success-message card animate-slide-up">
                    <div className="success-icon">✅</div>
                    <h3>¡Documento creado exitosamente!</h3>
                    {submitting ? (
                        <div className="ai-review-badge ai-review-analyzing">
                            <span className="ai-review-spinner"></span>
                            🤖 Revisando con IA...
                        </div>
                    ) : aiReviewSummary ? (
                        <div className={`ai-review-badge ${
                            aiReviewSummary.includes('corrección') || aiReviewSummary.includes('correcciones')
                                ? 'ai-review-applied'
                                : aiReviewSummary.includes('sin correcciones') || aiReviewSummary.includes('sin corrección')
                                ? 'ai-review-clean'
                                : 'ai-review-info'
                        }`}>
                            {aiReviewSummary.includes('corrección') || aiReviewSummary.includes('correcciones')
                                ? '🤖 ' : aiReviewSummary.includes('sin correcciones') || aiReviewSummary.includes('sin corrección')
                                ? '✅ ' : 'ℹ️ '}
                            {aiReviewSummary}
                        </div>
                    ) : null}
                    <p>Redirigiendo a la lista de documentos...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="new-document-form">
                    {error && (
                        <div className="error-banner"><span>⚠️</span> {error}</div>
                    )}

                    {/* Step 1: Title */}
                    <div className="form-section card">
                        <h2 className="form-section-title">1. Nombre del Documento</h2>
                        <div className="form-group">
                            <label className="form-label" htmlFor="title">Título del documento</label>
                            <input
                                id="title"
                                type="text"
                                className="form-input"
                                placeholder="Ej: Propuesta de servicios - Cliente A"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Step 2: Template */}
                    <div className="form-section card">
                        <h2 className="form-section-title">2. Seleccionar Plantilla</h2>
                        {templates.length === 0 ? (
                            <p className="no-templates">No hay plantillas disponibles</p>
                        ) : (
                            <div className="template-select-grid">
                                {templates.map(template => (
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

                    {/* Step 3: Data */}
                    {selectedTemplate && (
                        <div className="form-section card animate-slide-up">
                            <h2 className="form-section-title">3. Completar Datos</h2>

                            {loadingVars ? (
                                <div className="vars-loading">
                                    <div className="spinner"></div>
                                    <span>Cargando campos...</span>
                                </div>
                            ) : !hasVariables ? (
                                <p className="section-description">Esta plantilla no tiene variables configuradas.</p>
                            ) : (
                                <>
                                    {/* Simple fields */}
                                    {simpleFields.length > 0 && (
                                        <div className="variables-grid">
                                            {hasSchema ? (
                                                <DynamicForm
                                                    schema={simpleFields}
                                                    value={formData}
                                                    onChange={setFormData}
                                                />
                                            ) : (
                                                simpleFields.map(field => {
                                                    const name = typeof field === 'string' ? field : field.name
                                                    const label = typeof field === 'string' ? varLabel(field) : field.label
                                                    return (
                                                        <div key={name} className="form-group">
                                                            <label className="form-label">{label}</label>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={formData[name] || ''}
                                                                onChange={e => setFormData(prev => ({ ...prev, [name]: e.target.value }))}
                                                                placeholder={label}
                                                            />
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    )}

                                    {/* Dynamic groups */}
                                    {dynamicGroups.length > 0 && (
                                        <div className="dyn-groups-section">
                                            {dynamicGroups.map(group => (
                                                <DynamicGroupTable
                                                    key={group.name}
                                                    group={group}
                                                    items={groupItems[group.name] || []}
                                                    onChange={items => setGroupItems(prev => ({ ...prev, [group.name]: items }))}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/documents')}>
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn-info"
                            style={{ marginRight: 'auto', marginLeft: '1rem' }}
                            onClick={handlePreview}
                            disabled={!selectedTemplate || !title.trim() || submitting || previewLoading}
                        >
                            {previewLoading ? <><span className="spinner"></span> Cargando...</> : '👁️ Vista Previa'}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={!selectedTemplate || !title.trim() || submitting}
                        >
                            {submitting ? <><span className="spinner"></span> Generando...</> : '✨ Generar Documento'}
                        </button>
                    </div>
                </form>
            )}

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
