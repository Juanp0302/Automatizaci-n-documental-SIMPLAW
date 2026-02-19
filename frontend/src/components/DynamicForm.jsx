import { useState, useEffect } from 'react'
import './DynamicForm.css'

function DynamicForm({ schema, value, onChange }) {
    const [visibleFields, setVisibleFields] = useState(new Set())

    // Update visibility when value changes
    useEffect(() => {
        if (!schema) return

        const newVisible = new Set()

        schema.forEach(field => {
            if (!field.show_if) {
                newVisible.add(field.name)
            } else {
                // Check condition
                const targetField = field.show_if.field
                const targetValue = field.show_if.value

                // Simple equality check for now
                if (value[targetField] === targetValue) {
                    newVisible.add(field.name)
                }
            }
        })

        setVisibleFields(newVisible)
    }, [schema, value])

    if (!schema || schema.length === 0) return null

    const handleChange = (name, newValue) => {
        onChange({
            ...value,
            [name]: newValue
        })
    }

    return (
        <div className="dynamic-form">
            {schema.map(field => {
                if (!visibleFields.has(field.name)) return null

                return (
                    <div key={field.name} className="form-group animate-fade-in">
                        <label className="form-label">
                            {field.label || (field.name.includes('::') ? field.name.split('::')[0] : field.name).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>

                        {
                            field.type === 'select' ? (
                                <select
                                    className="form-select"
                                    value={value[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    required={true} // Could make this configurable
                                >
                                    <option value="">Seleccione una opción...</option>
                                    {field.options && field.options.map((opt, idx) => {
                                        const label = typeof opt === 'object' ? opt.label : opt;
                                        const val = typeof opt === 'object' ? opt.value : opt;
                                        return <option key={idx} value={val}>{label}</option>
                                    })}
                                </select>
                            ) : field.type === 'textarea' ? (
                                <textarea
                                    className="form-input"
                                    value={value[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    rows={4}
                                    required={true}
                                />
                            ) : (['text', undefined].includes(field.type) || !field.type) ? (
                                <textarea
                                    className="form-input form-textarea"
                                    value={value[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    rows={4}
                                    required={true}
                                    placeholder={field.placeholder || ''}
                                />
                            ) : (
                                <input
                                    type={field.type}
                                    className="form-input"
                                    value={value[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    placeholder={field.placeholder || ''}
                                    required={true}
                                />
                            )
                        }

                        {
                            field.help_text && (
                                <small className="form-text text-muted">{field.help_text}</small>
                            )
                        }
                    </div>
                )
            })}
        </div >
    )
}

export default DynamicForm
