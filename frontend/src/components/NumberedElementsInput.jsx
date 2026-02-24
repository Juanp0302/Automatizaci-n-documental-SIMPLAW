import { useState } from 'react'
import './NumberedElementsInput.css'

/**
 * NumberedElementsInput
 * Renders a dynamic list of items for a "numbered_elements" schema group.
 *
 * Props:
 *  - group: { name, label, fields: [{ name, label, type }] }
 *  - value: array of item objects [{ nombre: '', precio: '' }, ...]
 *  - onChange: (newArray) => void
 */
function NumberedElementsInput({ group, value = [], onChange }) {
    const { name: groupName, label: groupLabel, fields = [] } = group

    const addItem = () => {
        const emptyItem = {}
        fields.forEach(f => { emptyItem[f.name] = '' })
        onChange([...value, emptyItem])
    }

    const removeItem = (index) => {
        const updated = value.filter((_, i) => i !== index)
        onChange(updated)
    }

    const updateItem = (index, fieldName, newValue) => {
        const updated = value.map((item, i) =>
            i === index ? { ...item, [fieldName]: newValue } : item
        )
        onChange(updated)
    }

    return (
        <div className="numbered-elements-input">
            <div className="nei-header">
                <h4 className="nei-title">
                    <span className="nei-icon">🔢</span>
                    {groupLabel}
                </h4>
                <span className="nei-count">{value.length} elemento{value.length !== 1 ? 's' : ''}</span>
            </div>

            {value.length === 0 && (
                <div className="nei-empty">
                    No hay elementos. Haz clic en "+ Agregar" para comenzar.
                </div>
            )}

            <div className="nei-items">
                {value.map((item, index) => (
                    <div key={index} className="nei-item animate-slide-up">
                        <div className="nei-item-header">
                            <span className="nei-item-number">#{index + 1}</span>
                            <button
                                type="button"
                                className="nei-remove-btn"
                                onClick={() => removeItem(index)}
                                title="Eliminar elemento"
                            >
                                ×
                            </button>
                        </div>
                        <div className="nei-item-fields">
                            {fields.map(field => (
                                <div key={field.name} className="nei-field">
                                    <label className="nei-field-label">{field.label}</label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            className="form-input nei-field-input"
                                            value={item[field.name] || ''}
                                            onChange={e => updateItem(index, field.name, e.target.value)}
                                            placeholder={field.label}
                                            rows={2}
                                        />
                                    ) : (
                                        <input
                                            type={field.type === 'date' ? 'date' : 'text'}
                                            className="form-input nei-field-input"
                                            value={item[field.name] || ''}
                                            onChange={e => updateItem(index, field.name, e.target.value)}
                                            placeholder={field.label}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                className="nei-add-btn"
                onClick={addItem}
            >
                + Agregar {groupLabel.endsWith('s') ? groupLabel.slice(0, -1) : groupLabel}
            </button>

            {value.length > 0 && (
                <div className="nei-preview">
                    <span className="nei-preview-label">Variables generadas:</span>
                    {fields.map(f => (
                        <code key={f.name} className="nei-var-chip">
                            {`{{${groupName}_1_${f.name}}}`}
                        </code>
                    ))}
                    <code className="nei-var-chip nei-var-summary">{`{{lista_${groupName}}}`}</code>
                    <code className="nei-var-chip nei-var-summary">{`{{total_${groupName}}}`}</code>
                </div>
            )}
        </div>
    )
}

export default NumberedElementsInput
