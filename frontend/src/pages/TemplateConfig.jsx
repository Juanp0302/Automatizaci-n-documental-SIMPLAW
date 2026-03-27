import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { templatesAPI } from '../api/templates'
import { useToast } from '../context/ToastContext'
import './TemplateConfig.css'

function TemplateConfig() {
    const { id } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    const [template, setTemplate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [analyzingAI, setAnalyzingAI] = useState(false)
    const [schema, setSchema] = useState([])
    const [showAIPanel, setShowAIPanel] = useState(false)
    const [aiPromptText, setAiPromptText] = useState('')

    useEffect(() => {
        loadTemplate()
    }, [id])

    const loadTemplate = async () => {
        try {
            const response = await templatesAPI.getById(id)
            setTemplate(response.data)

            if (response.data.variables_schema) {
                let loadedSchema = response.data.variables_schema
                if (typeof loadedSchema === 'string') {
                    try { loadedSchema = JSON.parse(loadedSchema) } catch (e) { }
                }
                setSchema(Array.isArray(loadedSchema) ? loadedSchema : [])
            } else {
                // If no schema, try to auto-detect and prepopulate
                try {
                    const varsRes = await templatesAPI.getVariableGroups(id)
                    const { simple, groups } = varsRes.data
                    const newSchema = []
                    
                    simple.forEach(v => {
                        newSchema.push({
                            name: v,
                            label: v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            type: 'text'
                        })
                    })

                    groups.forEach(g => {
                        newSchema.push({
                            name: g.name,
                            label: g.label,
                            type: 'numbered_elements',
                            fields: g.fields.map(f => ({
                                name: f.name,
                                label: f.label,
                                type: 'text'
                            }))
                        })
                    })
                    
                    setSchema(newSchema)
                } catch (e) {
                    // ignore
                }
            }
        } catch (err) {
            console.error(err)
            toast.error('Error al cargar la plantilla')
            navigate('/templates')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await templatesAPI.update(id, {
                variables_schema: schema
            })
            toast.success('Configuración guardada exitosamente')
            navigate('/templates')
        } catch (err) {
            console.error(err)
            toast.error('Error al guardar la configuración')
        } finally {
            setSaving(false)
        }
    }

    // Auto-detect again
    const importFromDoc = async () => {
        if (!window.confirm("¿Estás seguro? Esto reemplazará la configuración actual detectando las variables del Word nuevamente.")) return
        try {
            const varsRes = await templatesAPI.getVariableGroups(id)
            const { simple, groups } = varsRes.data
            const newSchema = []
            
            simple.forEach(v => {
                newSchema.push({
                    name: v,
                    label: v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    type: 'text'
                })
            })

            groups.forEach(g => {
                newSchema.push({
                    name: g.name,
                    label: g.label,
                    type: 'numbered_elements',
                    fields: g.fields.map(f => ({
                        name: f.name,
                        label: f.label,
                        type: 'text'
                    }))
                })
            })
            
            setSchema(newSchema)
            toast.success('Variables detectadas e importadas')
        } catch (err) {
            toast.error('Error al importar variables')
        }
    }

    const analyzeWithAI = async (promptOverride) => {
        const userPrompt = promptOverride !== undefined ? promptOverride : aiPromptText
        setShowAIPanel(false)
        setAnalyzingAI(true)
        try {
            const varsRes = await templatesAPI.analyzeAI(id, userPrompt)
            const { simple, groups } = varsRes.data
            const newSchema = []
            
            if (simple && Array.isArray(simple)) {
                simple.forEach(v => {
                    newSchema.push({
                        name: v.name,
                        label: v.label,
                        type: v.type || 'text'
                    })
                })
            }

            if (groups && Array.isArray(groups)) {
                groups.forEach(g => {
                    newSchema.push({
                        name: g.name,
                        label: g.label,
                        type: 'numbered_elements',
                        fields: (g.fields || []).map(f => ({
                            name: f.name,
                            label: f.label,
                            type: f.type || 'text'
                        }))
                    })
                })
            }
            
            if (newSchema.length === 0) {
                toast.warning('No se detectaron variables. Intenta agregar instrucciones más específicas en el prompt.')
            } else {
                setSchema(newSchema)
                toast.success(`✨ ${newSchema.length} variables detectadas`)
            }
        } catch (err) {
            console.error('Error AI details:', err)
            const serverMsg = err?.response?.data?.detail
            toast.error(serverMsg || 'Error al analizar con IA')
        } finally {
            setAnalyzingAI(false)
        }
    }

    const updateField = (index, key, value) => {
        const newSchema = [...schema]
        newSchema[index] = { ...newSchema[index], [key]: value }
        setSchema(newSchema)
    }

    const removeField = (index) => {
        const newSchema = [...schema]
        newSchema.splice(index, 1)
        setSchema(newSchema)
    }

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>

    return (
        <div className="template-config-page animate-fade-in">
            <header className="config-header">
                <div>
                    <h1 className="page-title">Personalizar: {template?.title}</h1>
                    <p className="page-description">Ajusta cómo se verán las preguntas al crear un documento.</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowAIPanel(p => !p)}
                        disabled={analyzingAI || saving}
                        style={{ borderColor: '#a78bfa', color: '#8b5cf6', background: showAIPanel ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.05)' }}
                    >
                        {analyzingAI ? '✨ Analizando...' : '✨ Autocompletar con IA'}
                    </button>
                    <button className="btn btn-secondary" onClick={importFromDoc} disabled={analyzingAI || saving}>
                        ↻ Re-detectar de Word
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || analyzingAI}>
                        {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/templates')}>
                        Cerrar
                    </button>
                </div>
            </header>

            <div className="config-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* Panel de instrucciones IA */}
                {showAIPanel && (
                    <div className="ai-prompt-panel" style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(109,40,217,0.05))',
                        border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: '12px',
                        padding: '1.25rem 1.5rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div>
                            <h3 style={{ color: '#a78bfa', fontSize: '1rem', marginBottom: '0.35rem' }}>✨ Instrucciones para la IA</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                                Describe qué campos debería extraer. Ej: <em>"Este es un contrato de servicios legales. Extrae datos del cliente (nombre, cédula, correo), datos del abogado y una tabla de servicios con descripción y valor."</em>
                            </p>
                        </div>
                        <textarea
                            value={aiPromptText}
                            onChange={e => setAiPromptText(e.target.value)}
                            placeholder="Ej: Este es un contrato de honorarios. Necesito campos para nombre del cliente, cédula, valor acordado y fechas de pago."
                            rows={4}
                            style={{
                                width: '100%',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid rgba(139,92,246,0.3)',
                                borderRadius: '8px',
                                color: 'var(--color-text-primary)',
                                padding: '0.75rem',
                                fontSize: '0.9rem',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowAIPanel(false)}
                            >Cancelar</button>
                            <button
                                className="btn btn-primary"
                                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
                                onClick={() => analyzeWithAI(aiPromptText)}
                                disabled={analyzingAI}
                            >
                                {analyzingAI ? '✨ Analizando...' : '✨ Analizar con IA'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="config-editor card" style={{ flex: 'none', width: '100%' }}>
                    
                    <div className="editor-header">
                        <h2>Campos Detectados</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Por defecto, la herramienta es lo suficientemente inteligente para funcionar sin tocar nada aquí. 
                            Usa esta pantalla solo si quieres cambiar el nombre de una pregunta o crear opciones desplegables limitadas.
                        </p>
                    </div>

                    <div className="fields-list">
                        {schema.length === 0 && (
                            <div className="empty-state">
                                No se detectaron variables. Asegúrate de que tu Word tenga variables como {`{{cliente}}`} o {`{{pago_1_monto}}`}.
                            </div>
                        )}

                        {schema.map((field, index) => {
                            if (field.type === 'numbered_elements') {
                                return (
                                    <div key={index} className="field-card animate-slide-up" style={{ borderLeft: '4px solid #a78bfa' }}>
                                        <div className="field-header">
                                            <span style={{ fontWeight: '600', color: '#a78bfa' }}>📋 Grupo Dinámico (Lista)</span>
                                            <button className="btn-icon" onClick={() => removeField(index)}>×</button>
                                        </div>
                                        <div className="field-grid">
                                            <div className="form-group">
                                                <label>Nombre a mostrar</label>
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => updateField(index, 'label', e.target.value)}
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group" style={{ opacity: 0.7 }}>
                                                <label>Variable (Word)</label>
                                                <input type="text" value={field.name} disabled className="form-input" />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '1rem' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sub-campos (Columnas)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                                {(field.fields || []).map((f, i) => (
                                                    <span key={i} style={{ background: 'var(--color-bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid var(--color-border)' }}>
                                                        {f.label} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>({f.name})</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div key={index} className="field-card animate-slide-up">
                                    <div className="field-header">
                                        <span className="field-index">Campo Normal</span>
                                        <div className="field-actions">
                                            <button className="btn-icon" onClick={() => removeField(index)} title="Ocultar">×</button>
                                        </div>
                                    </div>

                                    <div className="field-grid">
                                        <div className="form-group">
                                            <label>Pregunta al usuario</label>
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={(e) => updateField(index, 'label', e.target.value)}
                                                className="form-input"
                                            />
                                        </div>
                                        <div className="form-group" style={{ opacity: 0.7 }}>
                                            <label>Variable (Word)</label>
                                            <input type="text" value={field.name} disabled className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label>Tipo de Entrada</label>
                                            <select
                                                value={field.type}
                                                onChange={(e) => updateField(index, 'type', e.target.value)}
                                                className="form-select"
                                            >
                                                <option value="text">Texto Corto</option>
                                                <option value="textarea">Texto Largo</option>
                                                <option value="date">Fecha</option>
                                                <option value="select">Opciones Desplegables</option>
                                            </select>
                                        </div>

                                        {field.type === 'select' && (
                                            <div className="form-group full-width" style={{background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px'}}>
                                                <label style={{marginBottom: '0.5rem', display: 'block'}}>Opciones Disponibles</label>
                                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                                    {(field.options || []).map((opt, optIdx) => {
                                                        const optLabel = typeof opt === 'object' ? opt.label : (typeof opt === 'string' && opt.includes('::') ? opt.split('::')[0] : opt);
                                                        const optValue = typeof opt === 'object' ? opt.value : (typeof opt === 'string' && opt.includes('::') ? opt.split('::')[1] : opt);
                                                        
                                                        const handleOptChange = (key, val) => {
                                                            const newOpts = [...(field.options || [])];
                                                            newOpts[optIdx] = { ...((typeof newOpts[optIdx] === 'object' ? newOpts[optIdx] : {label: optLabel, value: optValue})), [key]: val };
                                                            updateField(index, 'options', newOpts);
                                                        }

                                                        return (
                                                            <div key={optIdx} style={{display: 'flex', gap: '0.5rem'}}>
                                                                <input type="text" className="form-input" placeholder="Lo que ve el usuario (ej: Sí)" value={optLabel} onChange={e => handleOptChange('label', e.target.value)} />
                                                                <input type="text" className="form-input" placeholder="Lo que va al Word (ej: X)" value={optValue} onChange={e => handleOptChange('value', e.target.value)} />
                                                                <button className="btn-icon" onClick={() => {
                                                                    const newOpts = [...field.options];
                                                                    newOpts.splice(optIdx, 1);
                                                                    updateField(index, 'options', newOpts);
                                                                }}>×</button>
                                                            </div>
                                                        )
                                                    })}
                                                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => {
                                                        const newOpts = [...(field.options || []), { label: '', value: '' }];
                                                        updateField(index, 'options', newOpts);
                                                    }} style={{alignSelf: 'flex-start'}}>+ Añadir Opción</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TemplateConfig
