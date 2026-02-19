import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { templatesAPI } from '../api/templates'
import { useToast } from '../context/ToastContext'
import DynamicForm from '../components/DynamicForm'
import './TemplateConfig.css'

function TemplateConfig() {
    const { id } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    const [template, setTemplate] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [schema, setSchema] = useState([])
    const [previewData, setPreviewData] = useState({})

    // Helper to get variable names for "Show If" dropdowns
    const variableNames = schema.map(f => f.name)

    useEffect(() => {
        loadTemplate()
    }, [id])

    const loadTemplate = async () => {
        try {
            const response = await templatesAPI.getById(id)
            setTemplate(response.data)

            // Parse schema if it exists
            if (response.data.variables_schema) {
                let loadedSchema = response.data.variables_schema
                if (typeof loadedSchema === 'string') {
                    try { loadedSchema = JSON.parse(loadedSchema) } catch (e) { }
                }
                setSchema(Array.isArray(loadedSchema) ? loadedSchema : [])
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
        } catch (err) {
            console.error(err)
            toast.error('Error al guardar la configuración')
        } finally {
            setSaving(false)
        }
    }

    const addField = () => {
        setSchema([
            ...schema,
            {
                name: `new_variable_${schema.length + 1}`,
                label: 'Nueva Variable',
                type: 'text',
                options: [],
                show_if: null
            }
        ])
    }

    const removeField = (index) => {
        const newSchema = [...schema]
        newSchema.splice(index, 1)
        setSchema(newSchema)
    }

    const updateField = (index, key, value) => {
        const newSchema = [...schema]
        newSchema[index] = { ...newSchema[index], [key]: value }
        setSchema(newSchema)
    }

    // Imports variables from Doc (Regex)
    const importFromDoc = async () => {
        if (!window.confirm("¿Estás seguro? Esto reemplazará la configuración actual.")) return

        try {
            const response = await templatesAPI.getVariables(id)
            const vars = response.data || []

            const newSchema = vars.map(v => ({
                name: v,
                label: v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                type: 'text',
                options: [],
                show_if: null
            }))

            setSchema(newSchema)
            toast.success(`Se importaron ${vars.length} variables`)
        } catch (err) {
            toast.error('Error al importar variables')
        }
    }

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>

    return (
        <div className="template-config-page animate-fade-in">
            <header className="config-header">
                <div>
                    <h1 className="page-title">Configurar: {template?.title}</h1>
                    <p className="page-description">Define los campos y la lógica condicional</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={importFromDoc}>
                        ↻ Importar de Word
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/templates')}>
                        Cerrar
                    </button>
                </div>
            </header>

            <div className="config-layout">
                {/* Editor Column */}
                <div className="config-editor card">
                    <div className="editor-header">
                        <h2>Campos del Formulario (Árbol de Decisión)</h2>
                        <button className="btn btn-sm btn-info" onClick={addField}>+ Agregar Campo Raíz</button>
                    </div>

                    <div className="fields-list">
                        {schema.length === 0 && (
                            <div className="empty-state">
                                No hay campos definidos. <br />
                                Inicia importando desde Word o agrega uno manualmente.
                            </div>
                        )}

                        {/* Recursive Render Function */}
                        {(() => {
                            // Helper to find index in original schema
                            const getOriginalIndex = (f) => schema.findIndex(item => item === f);

                            const renderField = (field) => {
                                const index = getOriginalIndex(field);
                                if (index === -1) return null;

                                return (
                                    <div key={index} className="field-card animate-slide-up">
                                        <div className="field-header">
                                            <span className="field-index">#{index + 1} {field.show_if ? '(Derivado)' : '(Raíz)'}</span>
                                            <div className="field-actions">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => removeField(index)}
                                                    title="Eliminar campo"
                                                >×</button>
                                            </div>
                                        </div>

                                        <div className="field-grid">
                                            <div className="form-group">
                                                <label>Etiqueta (Pregunta)</label>
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => updateField(index, 'label', e.target.value)}
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Variable (Word)</label>
                                                <input
                                                    type="text"
                                                    value={field.name}
                                                    onChange={(e) => updateField(index, 'name', e.target.value)}
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Tipo</label>
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => updateField(index, 'type', e.target.value)}
                                                    className="form-select"
                                                >
                                                    <option value="text">Texto</option>
                                                    <option value="textarea">Área de Texto</option>
                                                    <option value="select">Lista Desplegable</option>
                                                    <option value="date">Fecha</option>
                                                </select>
                                            </div>

                                            {/* Options & Derived Questions */}
                                            {field.type === 'select' && (
                                                <div className="form-group full-width">
                                                    <div className="options-editor">
                                                        <div className="options-header">
                                                            <label>Opción de Respuesta</label>
                                                            <label>Texto a Insertar</label>
                                                            <div></div>
                                                        </div>

                                                        {(field.options || []).map((option, optIndex) => {
                                                            let label = typeof option === 'object' ? option.label : option;
                                                            let value = typeof option === 'object' ? option.value : option;
                                                            if (typeof option === 'string' && option.includes('::')) {
                                                                const parts = option.split('::');
                                                                label = parts[0].trim();
                                                                value = parts.slice(1).join('::').trim();
                                                            }

                                                            // Find derived fields for this option
                                                            const derivedFields = schema.filter(f =>
                                                                f.show_if &&
                                                                f.show_if.field === field.name &&
                                                                f.show_if.value === label // Match against Label/Value from User Perspective? Usually logic matches value. Let's assume matches Label for now as that's what user selects. 
                                                                // Actually, usually matches the string equality in schema.
                                                            );

                                                            const handleOptionChange = (key, newVal) => {
                                                                const newOptions = [...(field.options || [])];
                                                                let newOptionObj = typeof newOptions[optIndex] === 'object' ? { ...newOptions[optIndex] } : { label, value };
                                                                newOptionObj[key] = newVal;
                                                                newOptions[optIndex] = newOptionObj;
                                                                updateField(index, 'options', newOptions);
                                                            };

                                                            return (
                                                                <div key={optIndex} className="option-block">
                                                                    <div className="option-row">
                                                                        <input
                                                                            type="text"
                                                                            className="form-input"
                                                                            placeholder="Ej: Sí"
                                                                            value={label}
                                                                            onChange={(e) => handleOptionChange('label', e.target.value)}
                                                                        />
                                                                        <textarea
                                                                            className="form-input"
                                                                            placeholder="Texto a doc..."
                                                                            value={value}
                                                                            onChange={(e) => handleOptionChange('value', e.target.value)}
                                                                            rows={1}
                                                                        />
                                                                        <button
                                                                            className="option-remove-btn"
                                                                            onClick={() => {
                                                                                const newOptions = [...field.options];
                                                                                newOptions.splice(optIndex, 1);
                                                                                updateField(index, 'options', newOptions);
                                                                            }}
                                                                        >×</button>
                                                                    </div>

                                                                    {/* Derived Questions Area */}
                                                                    <div className="derived-questions">
                                                                        {derivedFields.map(derivedField => renderField(derivedField))}

                                                                        <button
                                                                            className="btn btn-xs btn-ghost"
                                                                            onClick={() => {
                                                                                const newField = {
                                                                                    name: `derived_${schema.length + 1}`,
                                                                                    label: 'Nueva Pregunta Derivada',
                                                                                    type: 'text',
                                                                                    options: [],
                                                                                    show_if: {
                                                                                        field: field.name,
                                                                                        value: label
                                                                                    }
                                                                                };
                                                                                setSchema([...schema, newField]);
                                                                            }}
                                                                        >
                                                                            ↳ Agregar Pregunta si "{label}"
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        <button
                                                            className="btn btn-sm btn-secondary add-option-btn"
                                                            onClick={() => {
                                                                const newOptions = [...(field.options || []), { label: '', value: '' }];
                                                                updateField(index, 'options', newOptions);
                                                            }}
                                                        >
                                                            + Agregar Opción
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Legacy Logic display (mostly for debugging or non-tree items) 
                                                If it's a root item, we don't show show_if. 
                                                If it's derived, it is shown in the tree. 
                                            */}
                                        </div>
                                    </div>
                                );
                            };

                            // Only render root fields (show_if is null or invalid)
                            const rootFields = schema.filter(f => !f.show_if || !f.show_if.field);
                            // Also render "Orphaned" fields (fields with show_if but parent not found) - To prevent data loss
                            const orphanedFields = schema.filter(f => {
                                if (!f.show_if || !f.show_if.field) return false;
                                return !schema.find(parent => parent.name === f.show_if.field);
                            });

                            return (
                                <>
                                    {rootFields.map(f => renderField(f))}
                                    {orphanedFields.length > 0 && (
                                        <div className="orphaned-section">
                                            <h3>⚠️ Campos Desvinculados</h3>
                                            {orphanedFields.map(f => renderField(f))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Preview Column */}
                <div className="config-preview card">
                    <div className="editor-header">
                        <h2>Vista Previa</h2>
                        <button className="btn btn-sm btn-secondary" onClick={() => setPreviewData({})}>Limpiar</button>
                    </div>

                    <div className="preview-container">
                        <DynamicForm
                            schema={schema}
                            value={previewData}
                            onChange={setPreviewData}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TemplateConfig
